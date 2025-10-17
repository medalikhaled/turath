import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Enhanced input validation using AuthErrorHandler
    if (!email || !otp) {
      const error = AuthErrorHandler.createError(AuthErrorCode.MISSING_REQUIRED_FIELD, {
        field: !email ? 'email' : 'otp'
      });
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_EMAIL);
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Verify OTP using Convex
    const otpVerification = await convex.mutation(api.authFunctions.verifyAdminOTP, {
      email: email.toLowerCase().trim(),
      otp,
    });

    if (!otpVerification.success) {
      let errorCode = AuthErrorCode.OTP_INVALID;

      if (otpVerification.error === 'OTP_EXPIRED') {
        errorCode = AuthErrorCode.OTP_EXPIRED;
      } else if (otpVerification.error === 'TOO_MANY_ATTEMPTS') {
        errorCode = AuthErrorCode.TOO_MANY_ATTEMPTS;
      }

      const error = AuthErrorHandler.createError(errorCode);
      return NextResponse.json(
        {
          error: error.messageAr,
          code: error.code,
        },
        { status: error.statusCode }
      );
    }

    // Check if email is admin
    const isAdminResult = await convex.query(api.authFunctions.isAdminEmail, {
      email: email.toLowerCase().trim(),
    });

    if (!isAdminResult.isAdmin) {
      const error = AuthErrorHandler.createError(AuthErrorCode.ADMIN_NOT_FOUND);
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Generate JWT token using OSLOJS SessionService with 24-hour expiration for admin
    const tokenResult = await SessionService.createSession({
      userId: email, // Use email as userId for admins
      email: email.toLowerCase().trim(),
      role: 'admin',
    });

    const token = tokenResult.token;

    // Create admin session in Convex
    await convex.mutation(api.authFunctions.createAdminSession, {
      email: email.toLowerCase().trim(),
      sessionId: token,
      expiresAt: tokenResult.expiresAt.getTime(),
    });

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: email,
        email: email.toLowerCase().trim(),
        role: 'admin',
      },
      token,
      sessionType: 'admin',
      expiresAt: tokenResult.expiresAt.getTime(),
    });

    // Set HTTP-only cookie for additional security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);

    // Use AuthErrorHandler for comprehensive error handling
    const authError = AuthErrorHandler.handleError(error, 'admin-login');

    return NextResponse.json(
      {
        error: authError.messageAr,
        code: authError.code,
        details: authError.details
      },
      { status: authError.statusCode || 500 }
    );
  }
}