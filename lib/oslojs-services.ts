/**
 * Oslo.js Services
 * 
 * Service layer wrapping crypto-service functions for authentication operations.
 * Provides PasswordService, SessionService, and OTPService interfaces.
 */

import {
  hashPassword as cryptoHashPassword,
  verifyPassword as cryptoVerifyPassword,
  generateOTP as cryptoGenerateOTP,
  verifyOTP as cryptoVerifyOTP,
  isOTPExpired as cryptoIsOTPExpired,
  createSessionToken,
  verifySessionToken,
  isSessionCloseToExpiry,
  generateSecureRandomString,
  type SessionPayload,
  type SessionTokenResult,
} from "./crypto-service";

// Re-export types
export type { SessionPayload, SessionTokenResult } from "./crypto-service";

// ============================================================================
// Password Service
// ============================================================================

export class PasswordService {
  /**
   * Hash a password using scrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return cryptoHashPassword(password);
  }

  /**
   * Verify a password against a stored hash
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return cryptoVerifyPassword(password, storedHash);
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    
    return password;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    errorsAr: string[];
  } {
    const errors: string[] = [];
    const errorsAr: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
      errorsAr.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
      errorsAr.push("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
      errorsAr.push("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
      errorsAr.push("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");
    }

    return {
      isValid: errors.length === 0,
      errors,
      errorsAr,
    };
  }
}

// ============================================================================
// Session Service
// ============================================================================

export class SessionService {
  /**
   * Create a new session token
   */
  static async createSession(data: {
    userId: string;
    email: string;
    role: "admin" | "student";
  }): Promise<SessionTokenResult> {
    return createSessionToken(data.userId, data.email, data.role);
  }

  /**
   * Verify a session token
   */
  static async verifySession(token: string): Promise<{
    isValid: boolean;
    payload: SessionPayload | null;
  }> {
    const payload = await verifySessionToken(token);
    return {
      isValid: payload !== null,
      payload,
    };
  }

  /**
   * Refresh a session token if close to expiration
   */
  static async refreshSession(token: string): Promise<string | null> {
    const payload = await verifySessionToken(token);
    
    if (!payload) {
      return null;
    }

    // Check if session is close to expiration (within 1 hour)
    const isCloseToExpiry = await isSessionCloseToExpiry(token, 60);
    
    if (!isCloseToExpiry) {
      return token; // No refresh needed
    }

    // Create new session token
    const newToken = await createSessionToken(
      payload.userId,
      payload.email,
      payload.role
    );

    return newToken.token;
  }

  /**
   * Revoke a session (client-side operation)
   */
  static async revokeSession(token: string): Promise<void> {
    // For JWT-based auth, revocation is primarily client-side
    // In production, you might want to maintain a blacklist
  }
}

// ============================================================================
// OTP Service
// ============================================================================

// In-memory OTP storage (should be moved to database in production)
const otpStore = new Map<string, {
  otp: string;
  createdAt: number;
  attempts: number;
}>();

export class OTPService {
  /**
   * Generate and store an OTP for an email
   */
  static generateOTP(email: string): { otp: string; expiresAt: number } {
    const otp = cryptoGenerateOTP();
    const createdAt = Date.now();
    const expiresAt = createdAt + (15 * 60 * 1000); // 15 minutes

    otpStore.set(email.toLowerCase().trim(), {
      otp,
      createdAt,
      attempts: 0,
    });

    return { otp, expiresAt };
  }

  /**
   * Verify an OTP for an email
   */
  static async verifyOTP(email: string, providedOTP: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpData = otpStore.get(normalizedEmail);

    if (!otpData) {
      return { success: false, error: "OTP_NOT_FOUND" };
    }

    // Check if OTP is expired
    if (cryptoIsOTPExpired(otpData.createdAt)) {
      otpStore.delete(normalizedEmail);
      return { success: false, error: "OTP_EXPIRED" };
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStore.delete(normalizedEmail);
      return { success: false, error: "TOO_MANY_ATTEMPTS" };
    }

    // Increment attempts
    otpData.attempts++;

    // Verify OTP
    if (!cryptoVerifyOTP(providedOTP, otpData.otp)) {
      return { success: false, error: "INVALID_OTP" };
    }

    // OTP verified - remove from store
    otpStore.delete(normalizedEmail);

    return { success: true };
  }

  /**
   * Clean up expired OTPs
   */
  static cleanupExpiredOTPs(): void {
    const now = Date.now();
    const expiryMs = 15 * 60 * 1000; // 15 minutes

    for (const [email, otpData] of otpStore.entries()) {
      if (now - otpData.createdAt > expiryMs) {
        otpStore.delete(email);
      }
    }
  }

  /**
   * Get OTP for testing purposes (development only)
   */
  static getOTPForTesting(email: string): string | null {
    if (process.env.NODE_ENV !== "development") {
      return null;
    }
    
    const otpData = otpStore.get(email.toLowerCase().trim());
    return otpData?.otp || null;
  }
}
