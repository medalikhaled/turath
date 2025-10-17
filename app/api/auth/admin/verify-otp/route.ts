import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Simple validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      );
    }

    // Check if email is admin using Convex query
    const { fetchQuery } = await import('convex/nextjs');
    const adminCheck = await fetchQuery(api.authFunctions.isAdminEmail, { email: email.toLowerCase().trim() });
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Email not authorized for admin access' },
        { status: 403 }
      );
    }

    // Verify OTP using Convex
    const { fetchMutation } = await import('convex/nextjs');
    const otpVerification = await fetchMutation(api.authFunctions.verifyAdminOTP, {
      email: email.toLowerCase().trim(),
      otp: otp
    });

    if (!otpVerification.success) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code' },
        { status: 400 }
      );
    }

    // Create or update admin user record in database
    const normalizedEmail = email.toLowerCase().trim();
    let adminUserResult;
    try {
      adminUserResult = await fetchMutation(api.adminManagement.createOrUpdateAdminUser, {
        email: normalizedEmail,
      });
    } catch (error) {
      console.error('Failed to create/update admin user:', error);
      return NextResponse.json(
        { error: 'Failed to create admin session' },
        { status: 500 }
      );
    }

    // Create JWT token using SessionService with proper user ID
    const tokenResult = await SessionService.createSession({
      userId: adminUserResult.userId, // Use actual user ID from users table
      email: normalizedEmail,
      role: 'admin',
    });

    // Store session in Convex
    await fetchMutation(api.authFunctions.createAdminSession, {
      email: normalizedEmail,
      sessionId: tokenResult.token,
      expiresAt: tokenResult.expiresAt.getTime(),
    });

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: adminUserResult.userId, // Use actual user ID from users table
        email: normalizedEmail,
        name: 'مدير النظام',
        role: 'admin',
      },
      token: tokenResult.token,
      sessionType: 'admin',
      expiresAt: tokenResult.expiresAt.getTime(),
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', tokenResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('❌ Error in verify-otp API:', error);
    return NextResponse.json(
      { error: 'Invalid or expired OTP code' },
      { status: 400 }
    );
  }
}

