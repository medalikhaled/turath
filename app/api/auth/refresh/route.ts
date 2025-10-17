import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token) {
      const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_TOKEN);
      return NextResponse.json(
        { success: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Attempt to refresh the session using OSLOJS SessionService
    const refreshedToken = await SessionService.refreshSession(token);
    
    if (!refreshedToken) {
      const error = AuthErrorHandler.createError(AuthErrorCode.SESSION_EXPIRED);
      const response = NextResponse.json(
        { success: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
      
      // Clear invalid token cookie
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Verify the refreshed token to get payload information
    const sessionValidation = await SessionService.verifySession(refreshedToken);
    
    if (!sessionValidation.isValid || !sessionValidation.payload) {
      const error = AuthErrorHandler.createError(AuthErrorCode.INTERNAL_ERROR);
      return NextResponse.json(
        { success: false, error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    const payload = sessionValidation.payload;

    // Create response with new token
    const response = NextResponse.json({
      success: true,
      message: 'تم تجديد الجلسة بنجاح',
      token: refreshedToken,
      expiresAt: payload.exp ? payload.exp * 1000 : null,
      sessionType: payload.role,
      refreshed: refreshedToken !== token,
    });

    // Update cookie with refreshed token
    response.cookies.set('auth-token', refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: payload.role === 'admin' ? 24 * 60 * 60 : 7 * 24 * 60 * 60, // 24h for admin, 7d for student
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Session refresh error:', error);
    
    // Use AuthErrorHandler for comprehensive error handling
    const authError = AuthErrorHandler.handleError(error, 'session-refresh');
    
    const response = NextResponse.json(
      { 
        success: false, 
        error: authError.messageAr, 
        code: authError.code,
        details: authError.details 
      },
      { status: authError.statusCode || 500 }
    );
    
    // Clear potentially corrupted token
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

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}