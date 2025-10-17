/**
 * Enhanced error handling for authentication with Arabic language support
 * Implements security-focused error responses and comprehensive error mapping
 */

export interface AuthError {
  code: string;
  message: string;
  messageAr: string;
  details?: Record<string, any>;
  statusCode?: number;
  timestamp?: number;
}

export interface AuthResult<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

export enum AuthErrorCode {
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',

  // Authorization Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ROLE_MISMATCH = 'ROLE_MISMATCH',
  ACCESS_DENIED = 'ACCESS_DENIED',

  // Session Errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_MALFORMED = 'TOKEN_MALFORMED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // Validation Errors
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',

  // Rate Limiting Errors
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  TEMPORARY_LOCKOUT = 'TEMPORARY_LOCKOUT',

  // OTP Errors
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  OTP_ALREADY_USED = 'OTP_ALREADY_USED',
  OTP_GENERATION_FAILED = 'OTP_GENERATION_FAILED',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Student-specific Errors
  STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND',
  STUDENT_INACTIVE = 'STUDENT_INACTIVE',
  STUDENT_CREATION_FAILED = 'STUDENT_CREATION_FAILED',

  // Admin-specific Errors
  ADMIN_NOT_FOUND = 'ADMIN_NOT_FOUND',
  ADMIN_ACCESS_REQUIRED = 'ADMIN_ACCESS_REQUIRED',
  INVALID_ADMIN_EMAIL = 'INVALID_ADMIN_EMAIL'
}

/**
 * Comprehensive error messages in English and Arabic
 */
const ERROR_MESSAGES: Record<AuthErrorCode, { en: string; ar: string; statusCode: number }> = {
  // Authentication Errors
  [AuthErrorCode.INVALID_CREDENTIALS]: {
    en: 'Invalid email or password',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    statusCode: 401
  },
  [AuthErrorCode.ACCOUNT_LOCKED]: {
    en: 'Account is temporarily locked due to multiple failed attempts',
    ar: 'الحساب مقفل مؤقتاً بسبب محاولات فاشلة متعددة',
    statusCode: 423
  },
  [AuthErrorCode.ACCOUNT_INACTIVE]: {
    en: 'Account is inactive. Please contact administration',
    ar: 'الحساب غير نشط. يرجى التواصل مع الإدارة',
    statusCode: 403
  },
  [AuthErrorCode.PASSWORD_EXPIRED]: {
    en: 'Password has expired. Please reset your password',
    ar: 'انتهت صلاحية كلمة المرور. يرجى إعادة تعيين كلمة المرور',
    statusCode: 401
  },

  // Authorization Errors
  [AuthErrorCode.INSUFFICIENT_PERMISSIONS]: {
    en: 'Insufficient permissions to access this resource',
    ar: 'صلاحيات غير كافية للوصول إلى هذا المورد',
    statusCode: 403
  },
  [AuthErrorCode.ROLE_MISMATCH]: {
    en: 'User role does not match required permissions',
    ar: 'دور المستخدم لا يتطابق مع الصلاحيات المطلوبة',
    statusCode: 403
  },
  [AuthErrorCode.ACCESS_DENIED]: {
    en: 'Access denied',
    ar: 'تم رفض الوصول',
    statusCode: 403
  },

  // Session Errors
  [AuthErrorCode.SESSION_EXPIRED]: {
    en: 'Session has expired. Please log in again',
    ar: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى',
    statusCode: 401
  },
  [AuthErrorCode.INVALID_TOKEN]: {
    en: 'Invalid authentication token',
    ar: 'رمز المصادقة غير صالح',
    statusCode: 401
  },
  [AuthErrorCode.TOKEN_MALFORMED]: {
    en: 'Authentication token is malformed',
    ar: 'رمز المصادقة مشوه',
    statusCode: 401
  },
  [AuthErrorCode.SESSION_NOT_FOUND]: {
    en: 'Session not found. Please log in again',
    ar: 'الجلسة غير موجودة. يرجى تسجيل الدخول مرة أخرى',
    statusCode: 401
  },

  // Validation Errors
  [AuthErrorCode.INVALID_EMAIL]: {
    en: 'Invalid email format',
    ar: 'تنسيق البريد الإلكتروني غير صالح',
    statusCode: 400
  },
  [AuthErrorCode.WEAK_PASSWORD]: {
    en: 'Password does not meet security requirements',
    ar: 'كلمة المرور لا تلبي متطلبات الأمان',
    statusCode: 400
  },
  [AuthErrorCode.MISSING_REQUIRED_FIELD]: {
    en: 'Required field is missing',
    ar: 'حقل مطلوب مفقود',
    statusCode: 400
  },
  [AuthErrorCode.INVALID_INPUT_FORMAT]: {
    en: 'Invalid input format',
    ar: 'تنسيق الإدخال غير صالح',
    statusCode: 400
  },

  // Rate Limiting Errors
  [AuthErrorCode.RATE_LIMITED]: {
    en: 'Too many requests. Please try again later',
    ar: 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً',
    statusCode: 429
  },
  [AuthErrorCode.TOO_MANY_ATTEMPTS]: {
    en: 'Too many failed attempts. Please try again later',
    ar: 'محاولات فاشلة كثيرة جداً. يرجى المحاولة لاحقاً',
    statusCode: 429
  },
  [AuthErrorCode.TEMPORARY_LOCKOUT]: {
    en: 'Account temporarily locked. Please try again later',
    ar: 'الحساب مقفل مؤقتاً. يرجى المحاولة لاحقاً',
    statusCode: 423
  },

  // OTP Errors
  [AuthErrorCode.OTP_EXPIRED]: {
    en: 'OTP has expired. Please request a new one',
    ar: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد',
    statusCode: 400
  },
  [AuthErrorCode.OTP_INVALID]: {
    en: 'Invalid OTP code',
    ar: 'رمز التحقق غير صحيح',
    statusCode: 400
  },
  [AuthErrorCode.OTP_ALREADY_USED]: {
    en: 'OTP has already been used',
    ar: 'تم استخدام رمز التحقق مسبقاً',
    statusCode: 400
  },
  [AuthErrorCode.OTP_GENERATION_FAILED]: {
    en: 'Failed to generate OTP. Please try again',
    ar: 'فشل في إنشاء رمز التحقق. يرجى المحاولة مرة أخرى',
    statusCode: 500
  },

  // System Errors
  [AuthErrorCode.INTERNAL_ERROR]: {
    en: 'Internal server error. Please try again later',
    ar: 'خطأ داخلي في الخادم. يرجى المحاولة لاحقاً',
    statusCode: 500
  },
  [AuthErrorCode.SERVICE_UNAVAILABLE]: {
    en: 'Service temporarily unavailable. Please try again later',
    ar: 'الخدمة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً',
    statusCode: 503
  },
  [AuthErrorCode.DATABASE_ERROR]: {
    en: 'Database error. Please try again later',
    ar: 'خطأ في قاعدة البيانات. يرجى المحاولة لاحقاً',
    statusCode: 500
  },
  [AuthErrorCode.EXTERNAL_SERVICE_ERROR]: {
    en: 'External service error. Please try again later',
    ar: 'خطأ في خدمة خارجية. يرجى المحاولة لاحقاً',
    statusCode: 502
  },

  // Student-specific Errors
  [AuthErrorCode.STUDENT_NOT_FOUND]: {
    en: 'Student not found',
    ar: 'الطالب غير موجود',
    statusCode: 404
  },
  [AuthErrorCode.STUDENT_INACTIVE]: {
    en: 'Student account is inactive. Please contact administration',
    ar: 'حساب الطالب غير نشط. يرجى التواصل مع الإدارة',
    statusCode: 403
  },
  [AuthErrorCode.STUDENT_CREATION_FAILED]: {
    en: 'Failed to create student account',
    ar: 'فشل في إنشاء حساب الطالب',
    statusCode: 500
  },

  // Admin-specific Errors
  [AuthErrorCode.ADMIN_NOT_FOUND]: {
    en: 'Admin not found',
    ar: 'المدير غير موجود',
    statusCode: 404
  },
  [AuthErrorCode.ADMIN_ACCESS_REQUIRED]: {
    en: 'Admin access required',
    ar: 'مطلوب وصول المدير',
    statusCode: 403
  },
  [AuthErrorCode.INVALID_ADMIN_EMAIL]: {
    en: 'Invalid admin email',
    ar: 'بريد إلكتروني غير صالح للمدير',
    statusCode: 400
  }
};

/**
 * Enhanced authentication error handler with Arabic language support
 */
export class AuthErrorHandler {
  /**
   * Create a standardized auth error
   */
  static createError(
    code: AuthErrorCode,
    details?: Record<string, any>,
    customMessage?: { en?: string; ar?: string }
  ): AuthError {
    const errorInfo = ERROR_MESSAGES[code];

    return {
      code,
      message: customMessage?.en || errorInfo.en,
      messageAr: customMessage?.ar || errorInfo.ar,
      details: this.sanitizeDetails(details),
      statusCode: errorInfo.statusCode,
      timestamp: Date.now()
    };
  }

  /**
   * Handle and map various error types to standardized auth errors
   */
  static handleError(error: any, context: string = 'unknown'): AuthError {
    // Log error for monitoring (without sensitive data)
    console.error(`Auth error in ${context}:`, {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      timestamp: Date.now()
    });

    // Map known error types
    if (error?.code && Object.values(AuthErrorCode).includes(error.code)) {
      return this.createError(error.code, error.details);
    }

    // Map JWT errors
    if (error?.name === 'JWTExpired' || error?.message?.includes('expired')) {
      return this.createError(AuthErrorCode.SESSION_EXPIRED);
    }

    if (error?.name === 'JWTInvalid' || error?.message?.includes('invalid')) {
      return this.createError(AuthErrorCode.INVALID_TOKEN);
    }

    if (error?.name === 'JWTMalformed' || error?.message?.includes('malformed')) {
      return this.createError(AuthErrorCode.TOKEN_MALFORMED);
    }

    // Map validation errors
    if (error?.message?.includes('email') && error?.message?.includes('invalid')) {
      return this.createError(AuthErrorCode.INVALID_EMAIL);
    }

    if (error?.message?.includes('password') && error?.message?.includes('weak')) {
      return this.createError(AuthErrorCode.WEAK_PASSWORD);
    }

    // Map rate limiting errors
    if (error?.message?.includes('rate limit') || error?.message?.includes('too many')) {
      return this.createError(AuthErrorCode.RATE_LIMITED);
    }

    // Map database errors
    if (error?.message?.includes('database') || error?.message?.includes('connection')) {
      return this.createError(AuthErrorCode.DATABASE_ERROR);
    }

    // Default to internal error for unknown errors
    return this.createError(AuthErrorCode.INTERNAL_ERROR, {
      originalError: error?.message || 'Unknown error'
    });
  }

  /**
   * Create a success result
   */
  static success<T>(data: T): AuthResult<T> {
    return {
      success: true,
      data
    };
  }

  /**
   * Create a failure result
   */
  static failure(error: AuthError): AuthResult {
    return {
      success: false,
      error
    };
  }

  /**
   * Create a failure result from error code
   */
  static failureFromCode(
    code: AuthErrorCode,
    details?: Record<string, any>,
    customMessage?: { en?: string; ar?: string }
  ): AuthResult {
    return this.failure(this.createError(code, details, customMessage));
  }

  /**
   * Sanitize error details to prevent information leakage
   */
  private static sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;

    const sanitized: Record<string, any> = {};
    const allowedKeys = [
      'field',
      'code',
      'type',
      'remainingAttempts',
      'lockoutDuration',
      'retryAfter',
      'validationErrors'
    ];

    for (const [key, value] of Object.entries(details)) {
      if (allowedKeys.includes(key)) {
        // Further sanitize specific values
        if (key === 'validationErrors' && Array.isArray(value)) {
          sanitized[key] = value.map(err => ({
            field: err.field,
            message: err.message,
            messageAr: err.messageAr
          }));
        } else {
          sanitized[key] = value;
        }
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  /**
   * Check if an error is a security-sensitive error that should be logged
   */
  static isSecuritySensitive(error: AuthError): boolean {
    const securitySensitiveCodes = [
      AuthErrorCode.TOO_MANY_ATTEMPTS,
      AuthErrorCode.ACCOUNT_LOCKED,
      AuthErrorCode.INVALID_CREDENTIALS,
      AuthErrorCode.ACCESS_DENIED,
      AuthErrorCode.INSUFFICIENT_PERMISSIONS
    ];

    return securitySensitiveCodes.includes(error.code as AuthErrorCode);
  }

  /**
   * Get user-friendly error message based on language preference
   */
  static getUserMessage(error: AuthError, language: 'en' | 'ar' = 'ar'): string {
    return language === 'ar' ? error.messageAr : error.message;
  }

  /**
   * Create a rate limiting error with remaining time
   */
  static createRateLimitError(retryAfterSeconds: number): AuthError {
    return this.createError(AuthErrorCode.RATE_LIMITED, {
      retryAfter: retryAfterSeconds
    }, {
      en: `Too many requests. Please try again in ${retryAfterSeconds} seconds`,
      ar: `طلبات كثيرة جداً. يرجى المحاولة بعد ${retryAfterSeconds} ثانية`
    });
  }

  /**
   * Create a validation error with field details
   */
  static createValidationError(field: string, message: string, messageAr: string): AuthError {
    return this.createError(AuthErrorCode.INVALID_INPUT_FORMAT, {
      field,
      validationErrors: [{
        field,
        message,
        messageAr
      }]
    });
  }

  /**
   * Create an OTP error with remaining attempts
   */
  static createOTPError(code: AuthErrorCode, remainingAttempts?: number): AuthError {
    const details = remainingAttempts !== undefined ? { remainingAttempts } : undefined;
    return this.createError(code, details);
  }

  /**
   * Validate email format and return appropriate error
   */
  static validateEmail(email: string): AuthError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return this.createError(AuthErrorCode.MISSING_REQUIRED_FIELD, {
        field: 'email'
      });
    }

    if (!emailRegex.test(email)) {
      return this.createError(AuthErrorCode.INVALID_EMAIL);
    }

    return null;
  }

  /**
   * Validate password strength and return appropriate error
   */
  static validatePassword(password: string): AuthError | null {
    if (!password) {
      return this.createError(AuthErrorCode.MISSING_REQUIRED_FIELD, {
        field: 'password'
      });
    }

    if (password.length < 8) {
      return this.createError(AuthErrorCode.WEAK_PASSWORD, {
        validationErrors: [{
          field: 'password',
          message: 'Password must be at least 8 characters long',
          messageAr: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
        }]
      });
    }

    return null;
  }
}

/**
 * Utility functions for common authentication error scenarios
 */
export class AuthErrorUtils {
  /**
   * Check if user should be temporarily locked out
   */
  static shouldLockout(failedAttempts: number, maxAttempts: number = 5): boolean {
    return failedAttempts >= maxAttempts;
  }

  /**
   * Calculate lockout duration based on failed attempts
   */
  static calculateLockoutDuration(failedAttempts: number): number {
    // Progressive lockout: 5 min, 15 min, 30 min, 1 hour, 2 hours
    const durations = [5, 15, 30, 60, 120]; // minutes
    const index = Math.min(failedAttempts - 5, durations.length - 1);
    return durations[index] * 60 * 1000; // convert to milliseconds
  }
}