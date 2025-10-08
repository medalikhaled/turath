import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { generateToken, TokenPayload } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني ورمز التحقق مطلوبان', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Verify OTP using existing OTP system
    const otpResult = await convex.mutation(api.otp.verifyAdminOTP, {
      email: email.toLowerCase().trim(),
      otp,
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { error: 'رمز التحقق غير صحيح أو منتهي الصلاحية', code: 'INVALID_OTP' },
        { status: 401 }
      );
    }

    // Get admin user data
    const adminUser = await convex.query(api.auth.getAdminByEmail, {
      email: email.toLowerCase().trim(),
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود أو غير نشط', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Generate JWT token for admin
    const tokenPayload: TokenPayload = {
      userId: adminUser.id,
      email: adminUser.email,
      role: 'admin',
      sessionType: 'admin',
    };

    const token = await generateToken(tokenPayload, '24h'); // 24 hours for admin

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
      token,
      sessionId: otpResult.sessionId, // Keep compatibility with existing OTP system
      expiresAt: otpResult.expiresAt,
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
    
    if (error.message?.includes('INVALID_OTP')) {
      return NextResponse.json(
        { error: 'رمز التحقق غير صحيح', code: 'INVALID_OTP' },
        { status: 401 }
      );
    }

    if (error.message?.includes('EXPIRED_OTP')) {
      return NextResponse.json(
        { error: 'رمز التحقق منتهي الصلاحية', code: 'EXPIRED_OTP' },
        { status: 401 }
      );
    }

    if (error.message?.includes('MAX_ATTEMPTS_EXCEEDED')) {
      return NextResponse.json(
        { error: 'تم تجاوز عدد المحاولات المسموح', code: 'MAX_ATTEMPTS_EXCEEDED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في تسجيل الدخول', code: 'LOGIN_ERROR' },
      { status: 500 }
    );
  }
}