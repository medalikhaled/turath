import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const STUDENT_SESSION_EXPIRES_IN = '7d'; // 7 days for students
const ADMIN_SESSION_EXPIRES_IN = '24h'; // 24 hours for admins

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'admin';
  sessionType: 'student' | 'admin';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface SessionData {
  userId: string;
  email: string;
  role: 'student' | 'admin';
  sessionType: 'student' | 'admin';
  expiresAt: number;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export async function generateToken(payload: TokenPayload, expiresIn?: string): Promise<string> {
  const expiry = expiresIn || (payload.role === 'admin' ? ADMIN_SESSION_EXPIRES_IN : STUDENT_SESSION_EXPIRES_IN);
  
  const jwt = new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionType: payload.sessionType
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('hanbali-heritage-academy')
    .setAudience('hanbali-heritage-academy-users')
    .setExpirationTime(expiry);

  return await jwt.sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'hanbali-heritage-academy',
      audience: 'hanbali-heritage-academy-users',
    });
    
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Create session data from token
export function createSessionData(payload: TokenPayload): SessionData {
  const expiresIn = payload.role === 'admin' ? ADMIN_SESSION_EXPIRES_IN : STUDENT_SESSION_EXPIRES_IN;
  const expiresAt = Date.now() + (parseExpiryToMs(expiresIn));
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionType: payload.sessionType,
    expiresAt
  };
}

// Parse expiry string to milliseconds
function parseExpiryToMs(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1));
  
  switch (unit) {
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
}

// Check if session is expired
export function isSessionExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

// Get session expiry time for role
export function getSessionExpiryForRole(role: 'student' | 'admin'): number {
  const expiry = role === 'admin' ? ADMIN_SESSION_EXPIRES_IN : STUDENT_SESSION_EXPIRES_IN;
  return Date.now() + parseExpiryToMs(expiry);
}