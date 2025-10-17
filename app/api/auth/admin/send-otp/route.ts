import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { sendAdminOTP } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    // Check if email is admin using Convex query
    const { fetchQuery, fetchMutation } = await import('convex/nextjs');
    const adminCheck = await fetchQuery(api.authFunctions.isAdminEmail, { email: email.toLowerCase().trim() });
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Email not authorized for admin access' },
        { status: 403 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes

    // Store OTP in Convex
    await fetchMutation(api.authFunctions.storeAdminOTP, {
      email: email.toLowerCase().trim(),
      otp,
      expiresAt,
    });

    const otpResult = { otp, expiresAt };

    console.log(`🔐 Generated OTP for admin: ${email}`);

    // Send OTP via email service (Resend in production, console in development)
    const emailSent = await sendAdminOTP(
      email, 
      otpResult.otp, 
      otpResult.expiresAt
    );

    if (!emailSent) {
      console.error(`❌ Failed to send OTP email to ${email}`);
      // Don't fail the request - OTP is still generated and logged in development
    } else {
      console.log(`✅ OTP email sent successfully to ${email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح',
      expiresAt: otpResult.expiresAt,
    });

  } catch (error: any) {
    console.error('❌ Error in send-otp API:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إرسال رمز التحقق' },
      { status: 500 }
    );
  }
}

