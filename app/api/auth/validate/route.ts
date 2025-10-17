import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token) {
      const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_TOKEN);
      return NextResponse.json(
        { valid: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Verify JWT token using OSLOJS SessionService
    const sessionValidation = await SessionService.verifySession(token);
    
    if (!sessionValidation.isValid || !sessionValidation.payload) {
      // Clear invalid token cookie
      const error = AuthErrorHandler.createError(AuthErrorCode.SESSION_EXPIRED);
      const response = NextResponse.json(
        { valid: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    const payload = sessionValidation.payload;

    // Get user data from database (works for both admin and student)
    let userData = null;
    
    try {
      userData = await convex.query(api.authFunctions.getUserByEmail, {
        email: payload.email,
      });
    } catch (dbError) {
      console.error('Database error during session validation:', dbError);
      const error = AuthErrorHandler.createError(AuthErrorCode.DATABASE_ERROR);
      return NextResponse.json(
        { valid: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    if (!userData) {
      const error = AuthErrorHandler.createError(
        payload.role === 'admin' ? AuthErrorCode.ADMIN_NOT_FOUND : AuthErrorCode.STUDENT_NOT_FOUND
      );
      const response = NextResponse.json(
        { valid: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Check if session needs refresh (using OSLOJS SessionService)
    const refreshedToken = await SessionService.refreshSession(token);
    const shouldRefresh = refreshedToken !== token;

    // Return enhanced session data
    const userResponse: any = {
      id: userData.userId,
      email: userData.email,
      name: userData.name || '',
      role: payload.role, // Use role from token for consistency
    };

    // Add role-specific data
    if (userData.role === 'student' && 'courses' in userData) {
      userResponse.courses = userData.courses;
      // Add enrollmentDate if it exists in the userData
      if ('enrollmentDate' in userData) {
        userResponse.enrollmentDate = userData.enrollmentDate;
      }
    }

    const response = NextResponse.json({
      success: true,
      valid: true,
      user: userResponse,
      sessionType: payload.role,
      expiresAt: payload.exp ? payload.exp * 1000 : null, // Convert to milliseconds
      issuedAt: payload.iat ? payload.iat * 1000 : null,
      tokenValid: true,
      refreshed: shouldRefresh,
      newToken: shouldRefresh ? refreshedToken : undefined,
    });

    // Update cookie with refreshed token if needed
    if (shouldRefresh && refreshedToken) {
      response.cookies.set('auth-token', refreshedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: userData.role === 'admin' ? 24 * 60 * 60 : 7 * 24 * 60 * 60, // 24h for admin, 7d for student
        path: '/',
      });
    }

    return response;
  } catch (error: any) {
    console.error('Session validation error:', error);
    
    // Use AuthErrorHandler for comprehensive error handling
    const authError = AuthErrorHandler.handleError(error, 'session-validation');
    
    // Clear potentially corrupted token
    const response = NextResponse.json(
      { 
        valid: false, 
        error: authError.messageAr, 
        code: authError.code,
        details: authError.details 
      },
      { status: authError.statusCode || 500 }
    );
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}