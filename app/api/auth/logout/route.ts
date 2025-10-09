import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyToken } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (token) {
      // Verify token to get user info
      const payload = await verifyToken(token);
      
      if (payload) {
        // Call logout mutation for cleanup
        await convex.mutation(api.auth.logout, {
          userId: payload.userId,
          sessionType: payload.sessionType,
        });

        // If it's an admin session, also clean up the OTP session
        if (payload.role === 'admin') {
          try {
            // Logout from OTP system using email
            await convex.mutation(api.otp.logoutAdmin, {
              email: payload.email,
            });
          } catch (error) {
            console.error('Error cleaning up admin OTP session:', error);
            // Continue with logout even if OTP cleanup fails
          }
        }
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

    // Clear auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, we should clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

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