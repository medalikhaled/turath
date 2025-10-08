import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب', code: 'EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'رمز التحقق مطلوب', code: 'OTP_REQUIRED' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'رمز التحقق يجب أن يكون 6 أرقام', code: 'INVALID_OTP_FORMAT' },
        { status: 400 }
      );
    }

    // Verify OTP and create admin session
    const verificationResult = await fetchMutation(api.otp.verifyAdminOTP, {
      email,
      otp,
    });

    if (!verificationResult.success) {
      return NextResponse.json(
        { error: 'فشل في التحقق من الرمز', code: 'VERIFICATION_FAILED' },
        { status: 400 }
      );
    }

    // Create JWT token for admin session
    const token = await new SignJWT({
      email: verificationResult.email,
      role: 'admin',
      sessionType: 'admin',
      sessionId: verificationResult.sessionId,
      expiresAt: verificationResult.expiresAt,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: verificationResult.message,
      user: {
        email: verificationResult.email,
        role: 'admin',
        sessionId: verificationResult.sessionId,
      },
      expiresAt: verificationResult.expiresAt,
    });

    // Set secure HTTP-only cookie
    response.cookies.set('admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Error in verify-otp API:', error);

    // Handle Convex errors
    if (error.data?.code) {
      return NextResponse.json(
        { error: error.data.message, code: error.data.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}