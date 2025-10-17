/**
 * Simple monitoring utility to track auth validation patterns
 * Helps ensure the optimization is working effectively
 */

interface ValidationMetrics {
  totalCalls: number;
  reasonCounts: Record<string, number>;
  lastReset: number;
}

class AuthValidationMonitor {
  private metrics: ValidationMetrics = {
    totalCalls: 0,
    reasonCounts: {},
    lastReset: Date.now(),
  };

  logValidation(reason: string) {
    this.metrics.totalCalls++;
    this.metrics.reasonCounts[reason] = (this.metrics.reasonCounts[reason] || 0) + 1;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.info(`[Auth Monitor] Validation #${this.metrics.totalCalls}: ${reason}`);
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      totalCalls: 0,
      reasonCounts: {},
      lastReset: Date.now(),
    };
  }

  // Get a summary of validation patterns
  getSummary() {
    const timeSinceReset = Date.now() - this.metrics.lastReset;
    const minutesSinceReset = Math.round(timeSinceReset / 1000 / 60);
    
    return {
      totalCalls: this.metrics.totalCalls,
      callsPerMinute: minutesSinceReset > 0 ? (this.metrics.totalCalls / minutesSinceReset).toFixed(2) : '0',
      topReasons: Object.entries(this.metrics.reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      minutesSinceReset,
    };
  }
}

// Global instance for monitoring
export const authMonitor = new AuthValidationMonitor();

// Helper function to log validation calls
export function logAuthValidation(reason: string) {
  authMonitor.logValidation(reason);
}

// Helper function to get validation summary (useful for debugging)
export function getAuthValidationSummary() {
  return authMonitor.getSummary();
}