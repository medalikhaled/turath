/**
 * Enhanced rate limiting service using OSLOJS utilities
 * Implements IP-based and user-based rate limiting with progressive delays
 */

import { encodeBase64 } from '@oslojs/encoding';
import { AuthErrorHandler } from './auth-error-handler';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string, context?: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
  lastRequest: number;
  violations: number;
}

export interface ProgressiveDelayConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  resetAfterMs: number;
}

/**
 * Enhanced rate limiting service with OSLOJS integration
 */
export class RateLimitingService {
  private static store = new Map<string, RateLimitRecord>();
  private static violationStore = new Map<string, { count: number; lastViolation: number }>();
  
  // Default configurations for different endpoints
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    // Authentication endpoints - stricter limits
    '/api/auth/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      skipSuccessfulRequests: true
    },
    '/api/auth/admin/request-otp': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3, // 3 OTP requests per 5 minutes
      skipSuccessfulRequests: false
    },
    '/api/auth/admin/verify-otp': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 verification attempts per 15 minutes
      skipSuccessfulRequests: true
    },
    '/api/auth/student/login': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      skipSuccessfulRequests: true
    },
    
    // General API endpoints
    '/api/': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      skipSuccessfulRequests: false
    },
    
    // Page access
    '/login': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20, // 20 page loads per 5 minutes
      skipSuccessfulRequests: false
    },
    
    // Default fallback
    'default': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
      skipSuccessfulRequests: false
    }
  };

  // Progressive delay configuration for failed authentication attempts
  private static readonly PROGRESSIVE_DELAY_CONFIG: ProgressiveDelayConfig = {
    baseDelayMs: 1000, // 1 second base delay
    maxDelayMs: 300000, // 5 minutes maximum delay
    multiplier: 2, // Double the delay each time
    resetAfterMs: 60 * 60 * 1000 // Reset after 1 hour of no violations
  };

  /**
   * Check rate limit for a given identifier and endpoint
   */
  static checkRateLimit(
    identifier: string,
    endpoint: string,
    customConfig?: Partial<RateLimitConfig>
  ): RateLimitResult {
    const config = this.getConfig(endpoint, customConfig);
    const key = config.keyGenerator ? config.keyGenerator(identifier, endpoint) : `${identifier}:${endpoint}`;
    
    const now = Date.now();
    const record = this.store.get(key);
    
    if (!record) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
        lastRequest: now,
        violations: 0
      });
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if window has expired
    if (now > record.resetTime) {
      // Reset the window
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
        lastRequest: now,
        violations: record.violations
      });
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      // Record violation
      record.violations++;
      this.recordViolation(identifier);
      
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter
      };
    }
    
    // Increment count
    record.count++;
    record.lastRequest = now;
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  /**
   * Record a successful request (for endpoints that skip successful requests)
   */
  static recordSuccess(identifier: string, endpoint: string): void {
    const config = this.getConfig(endpoint);
    
    if (config.skipSuccessfulRequests) {
      const key = config.keyGenerator ? config.keyGenerator(identifier, endpoint) : `${identifier}:${endpoint}`;
      const record = this.store.get(key);
      
      if (record && record.count > 0) {
        record.count--;
      }
    }
  }

  /**
   * Record a failed request (for endpoints that skip failed requests)
   */
  static recordFailure(identifier: string, endpoint: string): void {
    const config = this.getConfig(endpoint);
    
    if (config.skipFailedRequests) {
      const key = config.keyGenerator ? config.keyGenerator(identifier, endpoint) : `${identifier}:${endpoint}`;
      const record = this.store.get(key);
      
      if (record && record.count > 0) {
        record.count--;
      }
    }
  }

  /**
   * Get progressive delay for repeated violations
   */
  static getProgressiveDelay(identifier: string): number {
    const violation = this.violationStore.get(identifier);
    
    if (!violation) {
      return 0;
    }
    
    const now = Date.now();
    
    // Reset violations if enough time has passed
    if (now - violation.lastViolation > this.PROGRESSIVE_DELAY_CONFIG.resetAfterMs) {
      this.violationStore.delete(identifier);
      return 0;
    }
    
    // Calculate progressive delay
    const delay = Math.min(
      this.PROGRESSIVE_DELAY_CONFIG.baseDelayMs * Math.pow(this.PROGRESSIVE_DELAY_CONFIG.multiplier, violation.count - 1),
      this.PROGRESSIVE_DELAY_CONFIG.maxDelayMs
    );
    
    return delay;
  }

  /**
   * Check if identifier is currently in progressive delay
   */
  static isInProgressiveDelay(identifier: string): { inDelay: boolean; remainingMs: number } {
    const violation = this.violationStore.get(identifier);
    
    if (!violation) {
      return { inDelay: false, remainingMs: 0 };
    }
    
    const now = Date.now();
    const delay = this.getProgressiveDelay(identifier);
    const delayEndTime = violation.lastViolation + delay;
    
    if (now < delayEndTime) {
      return { inDelay: true, remainingMs: delayEndTime - now };
    }
    
    return { inDelay: false, remainingMs: 0 };
  }

  /**
   * Create rate limit headers for HTTP responses
   */
  static createHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    };
    
    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }
    
    return headers;
  }

  /**
   * Create rate limit error response
   */
  static createErrorResponse(result: RateLimitResult, identifier?: string): {
    error: any;
    headers: Record<string, string>;
    statusCode: number;
  } {
    const progressiveDelay = identifier ? this.getProgressiveDelay(identifier) : 0;
    const totalRetryAfter = Math.max(result.retryAfter || 0, Math.ceil(progressiveDelay / 1000));
    
    const error = AuthErrorHandler.createRateLimitError(totalRetryAfter);
    const headers = this.createHeaders({ ...result, retryAfter: totalRetryAfter });
    
    return {
      error: {
        code: error.code,
        message: error.message,
        messageAr: error.messageAr,
        retryAfter: totalRetryAfter,
        details: {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime,
          progressiveDelay: progressiveDelay > 0
        }
      },
      headers,
      statusCode: 429
    };
  }

  /**
   * Clean up expired records
   */
  static cleanup(): void {
    const now = Date.now();
    
    // Clean up rate limit records
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime + 60000) { // Keep for 1 minute after expiry
        this.store.delete(key);
      }
    }
    
    // Clean up violation records
    for (const [key, violation] of this.violationStore.entries()) {
      if (now - violation.lastViolation > this.PROGRESSIVE_DELAY_CONFIG.resetAfterMs) {
        this.violationStore.delete(key);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  static getStats(): {
    activeRecords: number;
    activeViolations: number;
    totalRequests: number;
    totalViolations: number;
  } {
    let totalRequests = 0;
    let totalViolations = 0;
    
    for (const record of this.store.values()) {
      totalRequests += record.count;
      totalViolations += record.violations;
    }
    
    return {
      activeRecords: this.store.size,
      activeViolations: this.violationStore.size,
      totalRequests,
      totalViolations
    };
  }

  /**
   * Reset rate limits for a specific identifier (admin function)
   */
  static resetLimits(identifier: string): void {
    // Remove all records for this identifier
    for (const key of this.store.keys()) {
      if (key.startsWith(identifier + ':')) {
        this.store.delete(key);
      }
    }
    
    // Remove violation record
    this.violationStore.delete(identifier);
  }

  /**
   * Create secure key using OSLOJS encoding
   */
  static createSecureKey(identifier: string, endpoint: string, salt?: string): string {
    const data = `${identifier}:${endpoint}:${salt || 'default'}`;
    const encoded = encodeBase64(new TextEncoder().encode(data));
    return encoded.substring(0, 32); // Limit key length
  }

  /**
   * Private helper methods
   */
  private static getConfig(endpoint: string, customConfig?: Partial<RateLimitConfig>): RateLimitConfig {
    let baseConfig = this.DEFAULT_CONFIGS['default'];
    
    // Find the most specific matching config
    for (const [path, config] of Object.entries(this.DEFAULT_CONFIGS)) {
      if (path !== 'default' && endpoint.startsWith(path)) {
        baseConfig = config;
        break;
      }
    }
    
    return { ...baseConfig, ...customConfig };
  }

  private static recordViolation(identifier: string): void {
    const now = Date.now();
    const existing = this.violationStore.get(identifier);
    
    if (existing) {
      existing.count++;
      existing.lastViolation = now;
    } else {
      this.violationStore.set(identifier, {
        count: 1,
        lastViolation: now
      });
    }
  }
}

/**
 * Utility functions for rate limiting
 */
export class RateLimitUtils {
  /**
   * Generate identifier from request context
   */
  static generateIdentifier(ip: string, userId?: string, userAgent?: string): string {
    if (userId) {
      return `user:${userId}`;
    }
    
    // Create a hash of IP + User Agent for better uniqueness
    const combined = `${ip}:${userAgent || 'unknown'}`;
    return `ip:${RateLimitingService.createSecureKey(combined, 'identifier')}`;
  }

  /**
   * Check if IP is whitelisted (for admin IPs, etc.)
   */
  static isWhitelisted(ip: string): boolean {
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistedIPs.includes(ip);
  }

  /**
   * Get rate limit configuration for specific user roles
   */
  static getConfigForRole(role: 'student' | 'admin' | 'anonymous', endpoint: string): Partial<RateLimitConfig> {
    switch (role) {
      case 'admin':
        return {
          maxRequests: 200, // Higher limits for admins
          windowMs: 60 * 1000
        };
      case 'student':
        return {
          maxRequests: 100, // Standard limits for students
          windowMs: 60 * 1000
        };
      case 'anonymous':
      default:
        return {
          maxRequests: 20, // Lower limits for anonymous users
          windowMs: 60 * 1000
        };
    }
  }

  /**
   * Create middleware-friendly rate limit checker
   */
  static createMiddlewareChecker(endpoint: string, customConfig?: Partial<RateLimitConfig>) {
    return (identifier: string) => {
      return RateLimitingService.checkRateLimit(identifier, endpoint, customConfig);
    };
  }
}

// Cleanup interval - run every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimitingService.cleanup();
  }, 5 * 60 * 1000);
}