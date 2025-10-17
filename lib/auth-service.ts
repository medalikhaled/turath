/**
 * Authentication Service
 * 
 * Unified authentication interface for admin OTP flow and student password flow.
 * Implements session management with proper expiration handling.
 */

import {
    hashPassword,
    verifyPassword,
    generateOTP,
    verifyOTP,
    isOTPExpired,
    createSessionToken,
    verifySessionToken,
    type SessionPayload,
    type SessionTokenResult,
} from "./crypto-service";

// Re-export types for convenience
export type { SessionPayload, SessionTokenResult } from "./crypto-service";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AuthResult<T = any> {
    success: boolean;
    data?: T;
    error?: AuthError;
}

export interface AuthError {
    code: AuthErrorCode;
    message: string;
    messageAr: string;
    details?: Record<string, any>;
}

export enum AuthErrorCode {
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
    OTP_EXPIRED = "OTP_EXPIRED",
    OTP_INVALID = "OTP_INVALID",
    EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    RATE_LIMITED = "RATE_LIMITED",
    UNAUTHORIZED = "UNAUTHORIZED",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    INVALID_EMAIL = "INVALID_EMAIL",
}

export interface UserData {
    userId: string;
    email: string;
    role: "admin" | "student";
    name?: string;
}

export interface SessionData extends UserData {
    expiresAt: Date;
}

export interface OTPData {
    email: string;
    otp: string;
    createdAt: number;
    attempts: number;
}

// ============================================================================
// Configuration
// ============================================================================

// Hardcoded admin emails
const ADMIN_EMAILS = [
    "medalikhaled331@gmail.com",
    // Add more admin emails here
];

// OTP configuration
const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 15;

// In-memory OTP storage (for development - should be moved to database in production)
const otpStore = new Map<string, OTPData>();

// ============================================================================
// Admin Authentication (OTP Flow)
// ============================================================================

/**
 * Check if an email belongs to an admin
 * 
 * @param email - Email address to check
 * @returns true if email is in admin list
 */
export function isAdminEmail(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail);
}

/**
 * Generate and store OTP for admin authentication
 * 
 * @param email - Admin email address
 * @returns AuthResult with OTP (for development logging)
 */
export function generateAdminOTP(email: string): AuthResult<{ otp: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Verify admin email
    if (!isAdminEmail(normalizedEmail)) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.UNAUTHORIZED,
                message: "Not authorized as admin",
                messageAr: "غير مصرح كمسؤول",
            },
        };
    }

    // Generate OTP
    const otp = generateOTP();
    const now = Date.now();

    // Store OTP
    otpStore.set(normalizedEmail, {
        email: normalizedEmail,
        otp,
        createdAt: now,
        attempts: 0,
    });

    // Clean up expired OTPs
    cleanupExpiredOTPs();

    return {
        success: true,
        data: { otp },
    };
}

/**
 * Verify admin OTP and create session
 * 
 * @param email - Admin email address
 * @param providedOTP - OTP provided by user
 * @returns AuthResult with session token
 */
export async function verifyAdminOTP(
    email: string,
    providedOTP: string
): Promise<AuthResult<SessionTokenResult>> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get stored OTP
    const otpData = otpStore.get(normalizedEmail);

    if (!otpData) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.OTP_INVALID,
                message: "OTP not found or expired",
                messageAr: "رمز التحقق غير صحيح أو منتهي الصلاحية",
            },
        };
    }

    // Check if OTP expired
    if (isOTPExpired(otpData.createdAt)) {
        otpStore.delete(normalizedEmail);
        return {
            success: false,
            error: {
                code: AuthErrorCode.OTP_EXPIRED,
                message: "OTP has expired",
                messageAr: "انتهت صلاحية رمز التحقق",
            },
        };
    }

    // Check attempts
    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(normalizedEmail);
        return {
            success: false,
            error: {
                code: AuthErrorCode.RATE_LIMITED,
                message: "Too many attempts",
                messageAr: "عدد كبير جداً من المحاولات",
            },
        };
    }

    // Increment attempts
    otpData.attempts++;

    // Verify OTP
    if (!verifyOTP(providedOTP, otpData.otp)) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.OTP_INVALID,
                message: "Invalid OTP",
                messageAr: "رمز التحقق غير صحيح",
            },
        };
    }

    // OTP verified - remove from store
    otpStore.delete(normalizedEmail);

    // Create session token
    const sessionToken = await createSessionToken(
        normalizedEmail, // Using email as userId for admins
        normalizedEmail,
        "admin"
    );

    return {
        success: true,
        data: sessionToken,
    };
}

// ============================================================================
// Student Authentication (Password Flow)
// ============================================================================

/**
 * Authenticate student with email and password
 * 
 * @param email - Student email address
 * @param password - Student password
 * @param passwordHash - Hashed password from database
 * @param userId - User ID from database
 * @param isActive - Whether account is active
 * @returns AuthResult with session token
 */
export async function authenticateStudent(
    email: string,
    password: string,
    passwordHash: string,
    userId: string,
    isActive: boolean
): Promise<AuthResult<SessionTokenResult>> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if account is active
    if (!isActive) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.ACCOUNT_INACTIVE,
                message: "Account is inactive",
                messageAr: "الحساب غير نشط",
            },
        };
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, passwordHash);

    if (!isPasswordValid) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.INVALID_CREDENTIALS,
                message: "Invalid credentials",
                messageAr: "بيانات الدخول غير صحيحة",
            },
        };
    }

    // Create session token
    const sessionToken = await createSessionToken(
        userId,
        normalizedEmail,
        "student"
    );

    return {
        success: true,
        data: sessionToken,
    };
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Validate a session token
 * 
 * @param token - JWT session token
 * @returns AuthResult with session data
 */
export async function validateSession(
    token: string
): Promise<AuthResult<SessionPayload>> {
    const payload = await verifySessionToken(token);

    if (!payload) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.SESSION_EXPIRED,
                message: "Session expired or invalid",
                messageAr: "انتهت صلاحية الجلسة",
            },
        };
    }

    return {
        success: true,
        data: payload,
    };
}

/**
 * Refresh a session token if close to expiration
 * 
 * @param token - Current JWT session token
 * @returns AuthResult with new session token or null if not needed
 */
export async function refreshSessionIfNeeded(
    token: string
): Promise<AuthResult<SessionTokenResult | null>> {
    const payload = await verifySessionToken(token);

    if (!payload) {
        return {
            success: false,
            error: {
                code: AuthErrorCode.SESSION_EXPIRED,
                message: "Session expired or invalid",
                messageAr: "انتهت صلاحية الجلسة",
            },
        };
    }

    // Check if session is close to expiration (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    const oneHour = 60 * 60;

    // If more than 1 hour remaining, no refresh needed
    if (timeUntilExpiry > oneHour) {
        return {
            success: true,
            data: null,
        };
    }

    // Create new session token
    const newToken = await createSessionToken(
        payload.userId,
        payload.email,
        payload.role
    );

    return {
        success: true,
        data: newToken,
    };
}

/**
 * Revoke a session (logout)
 * For JWT-based sessions, this is primarily client-side (remove cookie)
 * In production, you might want to maintain a blacklist
 * 
 * @param token - JWT session token to revoke
 * @returns AuthResult
 */
export async function revokeSession(token: string): Promise<AuthResult<void>> {
    // For JWT-based auth, we don't need to do anything server-side
    // The client will remove the cookie
    // In production, you might want to add the token to a blacklist

    return {
        success: true,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clean up expired OTPs from memory
 */
function cleanupExpiredOTPs(): void {
    const now = Date.now();
    const expiryMs = OTP_EXPIRY_MINUTES * 60 * 1000;

    for (const [email, otpData] of otpStore.entries()) {
        if (now - otpData.createdAt > expiryMs) {
            otpStore.delete(email);
        }
    }
}

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Create error response
 * 
 * @param code - Error code
 * @param message - English error message
 * @param messageAr - Arabic error message
 * @returns AuthResult with error
 */
export function createAuthError(
    code: AuthErrorCode,
    message: string,
    messageAr: string
): AuthResult<never> {
    return {
        success: false,
        error: {
            code,
            message,
            messageAr,
        },
    };
}

/**
 * Hash a password for storage
 * Wrapper around crypto-service for convenience
 * 
 * @param password - Plain text password
 * @returns Promise resolving to hashed password
 */
export async function hashPasswordForStorage(password: string): Promise<string> {
    return hashPassword(password);
}
