import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';
import { AuthErrorHandler } from '@/lib/auth-error-handler';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;

    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (token) {
      // Verify token using OSLOJS SessionService to get user info
      const sessionValidation = await SessionService.verifySession(token);

      if (sessionValidation.isValid && sessionValidation.payload) {
        const payload = sessionValidation.payload;

        try {
          // Revoke session if admin
          if (payload.role === 'admin') {
            // TODO: For admin, we might want to revoke the session in Convex
            // For now, just clean up client-side
          }

          // If it's an admin session, also clean up the OTP session
          if (payload.role === 'admin') {
            try {
              // Revoke admin session in Convex
              await convex.mutation(api.authFunctions.revokeSession, {
                sessionId: token,
              });
            } catch (error) {
              console.error('Error cleaning up admin OTP session:', error);
              // Continue with logout even if OTP cleanup fails
            }
          }
        } catch (convexError) {
          console.error('Error during Convex logout cleanup:', convexError);
          // Continue with logout even if Convex cleanup fails
        }
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

    // Clear all auth-related cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('admin-session', '', cookieOptions); // Clear legacy admin session cookie if exists

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);

    // Use AuthErrorHandler for logging but still proceed with logout
    AuthErrorHandler.handleError(error, 'logout');

    // Even if there's an error, we should clear the cookies and return success
    // This ensures the user can always log out from the frontend
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
      warning: 'Some cleanup operations may have failed, but logout was successful'
    });

    // Clear all auth-related cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
      path: '/',
    };

    response.cookies.set('auth-token', '', cookieOptions);
    response.cookies.set('admin-session', '', cookieOptions);

    return response;
  }
}