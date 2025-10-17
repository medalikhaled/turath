/**
 * Cryptographic Service
 * 
 * Implements secure cryptographic operations following The Copenhagen Book guidelines.
 * Provides password hashing with scrypt (Node.js native), OTP generation, and session token management.
 */

import { encodeBase64, decodeBase64, encodeBase64url } from "@oslojs/encoding";
import { 
  parseJWT, 
  encodeJWT, 
  createJWTSignatureMessage,
} from "@oslojs/jwt";
import { SHA256 } from "@oslojs/crypto/sha2";
import { hmac } from "@oslojs/crypto/hmac";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SessionPayload {
  userId: string;
  email: string;
  role: "admin" | "student";
  iat: number;
  exp: number;
}

export interface SessionTokenResult {
  token: string;
  expiresAt: Date;
}

// ============================================================================
// Configuration
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || "your-secure-jwt-secret-key-change-in-production";
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

// Session durations
const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STUDENT_SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 15 * 60; // 15 minutes

// ============================================================================
// Password Hashing (scrypt)
// ============================================================================

/**
 * Hash a password using scrypt following Copenhagen Book recommendations
 * scrypt is recommended as a secure alternative to Argon2id when Argon2id is not available
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to base64-encoded hash with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate cryptographically secure random salt (16 bytes)
  const salt = randomBytes(16);
  
  // Hash password with scrypt
  // Parameters follow OWASP recommendations for scrypt
  // N=16384 (CPU/memory cost), r=8 (block size), p=1 (parallelization)
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  
  // Combine salt and hash for storage
  const combined = Buffer.concat([salt, hash]);
  
  return encodeBase64(new Uint8Array(combined));
}

/**
 * Verify a password against a stored hash
 * 
 * @param password - Plain text password to verify
 * @param storedHash - Base64-encoded hash from storage
 * @returns Promise resolving to true if password matches
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = Buffer.from(decodeBase64(storedHash));
    
    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const salt = combined.subarray(0, 16);
    const expectedHash = combined.subarray(16);
    
    // Hash the provided password with the same salt
    const actualHash = (await scryptAsync(password, salt, 64)) as Buffer;
    
    // Constant-time comparison to prevent timing attacks
    if (actualHash.length !== expectedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < actualHash.length; i++) {
      result |= actualHash[i] ^ expectedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// ============================================================================
// OTP Generation and Validation
// ============================================================================

/**
 * Generate a cryptographically secure 6-digit OTP
 * 
 * @returns 6-digit numeric OTP string
 */
export function generateOTP(): string {
  // Generate cryptographically secure random bytes
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  
  // Convert to number and ensure 6 digits
  const randomNumber = new DataView(randomBytes.buffer).getUint32(0, false);
  const otp = (randomNumber % 1000000).toString().padStart(OTP_LENGTH, "0");
  
  return otp;
}

/**
 * Verify an OTP against the expected value
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param provided - OTP provided by user
 * @param expected - Expected OTP value
 * @returns true if OTP matches
 */
export function verifyOTP(provided: string, expected: string): boolean {
  // Ensure both are strings and same length
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }
  
  if (provided.length !== expected.length) {
    return false;
  }
  
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < provided.length; i++) {
    result |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if an OTP has expired
 * 
 * @param createdAt - Timestamp when OTP was created
 * @returns true if OTP has expired
 */
export function isOTPExpired(createdAt: number): boolean {
  const now = Date.now();
  const expiryTime = createdAt + (OTP_EXPIRY_SECONDS * 1000);
  return now > expiryTime;
}

// ============================================================================
// Session Token Management (JWT)
// ============================================================================

/**
 * Create a secure session token (JWT) for authenticated user
 * 
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @param role - User's role (admin or student)
 * @returns Session token and expiration date
 */
export async function createSessionToken(
  userId: string,
  email: string,
  role: "admin" | "student"
): Promise<SessionTokenResult> {
  const now = Math.floor(Date.now() / 1000);
  
  // Determine session duration based on role
  const durationMs = role === "admin" ? ADMIN_SESSION_DURATION : STUDENT_SESSION_DURATION;
  const expiresAt = new Date(Date.now() + durationMs);
  const exp = Math.floor(expiresAt.getTime() / 1000);
  
  // Create JWT header
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  
  // Create JWT payload
  const payload: SessionPayload = {
    userId,
    email,
    role,
    iat: now,
    exp,
  };
  
  // Encode header and payload
  const headerJSON = JSON.stringify(header);
  const payloadJSON = JSON.stringify(payload);
  
  // Create signature message
  const signatureMessage = createJWTSignatureMessage(headerJSON, payloadJSON);
  
  // Sign with HMAC-SHA256
  const signature = hmac(SHA256, JWT_SECRET_BYTES, signatureMessage);
  
  // Encode JWT
  const token = encodeJWT(headerJSON, payloadJSON, signature);
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Verify and decode a session token
 * 
 * @param token - JWT token to verify
 * @returns Session payload if valid, null otherwise
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    // Parse JWT
    const [header, payload, providedSignature, signatureMessage] = parseJWT(token);
    
    // Verify algorithm
    if ((header as any).alg !== "HS256") {
      return null;
    }
    
    // Verify signature
    const expectedSignature = hmac(SHA256, JWT_SECRET_BYTES, signatureMessage);
    
    // Constant-time comparison
    if (providedSignature.length !== expectedSignature.length) {
      return null;
    }
    
    let result = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      result |= providedSignature[i] ^ expectedSignature[i];
    }
    
    if (result !== 0) {
      return null;
    }
    
    // Validate payload structure
    const claims = payload as any;
    if (
      typeof claims.userId !== "string" ||
      typeof claims.email !== "string" ||
      (claims.role !== "admin" && claims.role !== "student") ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number"
    ) {
      return null;
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) {
      return null;
    }
    
    return claims as SessionPayload;
  } catch (error) {
    console.error("Session token verification error:", error);
    return null;
  }
}

/**
 * Check if a session token is close to expiration
 * Useful for implementing token refresh logic
 * 
 * @param token - JWT token to check
 * @param thresholdMinutes - Minutes before expiration to consider "close"
 * @returns true if token expires within threshold
 */
export async function isSessionCloseToExpiry(
  token: string,
  thresholdMinutes: number = 60
): Promise<boolean> {
  const payload = await verifySessionToken(token);
  if (!payload) {
    return true; // Invalid token is considered expired
  }
  
  const now = Math.floor(Date.now() / 1000);
  const thresholdSeconds = thresholdMinutes * 60;
  
  return (payload.exp - now) < thresholdSeconds;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a cryptographically secure random string
 * Useful for generating session IDs, tokens, etc.
 * 
 * @param length - Length of random string in bytes
 * @returns Base64-encoded random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return encodeBase64(bytes);
}

/**
 * Get session duration in milliseconds for a given role
 * 
 * @param role - User role
 * @returns Session duration in milliseconds
 */
export function getSessionDuration(role: "admin" | "student"): number {
  return role === "admin" ? ADMIN_SESSION_DURATION : STUDENT_SESSION_DURATION;
}
