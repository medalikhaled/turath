import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

// Email service configuration
// For now, we'll simulate email sending. In production, you would use:
// - Resend (recommended for Next.js)
// - SendGrid
// - AWS SES
// - Nodemailer with SMTP

interface EmailService {
  sendOTP(to: string, otp: string, expiresAt: number): Promise<boolean>;
}

class MockEmailService implements EmailService {
  async sendOTP(to: string, otp: string, expiresAt: number): Promise<boolean> {
    // In development, log the OTP to console
    console.log(`📧 OTP Email for ${to}:`);
    console.log(`رمز التحقق: ${otp}`);
    console.log(`ينتهي في: ${new Date(expiresAt).toLocaleString('ar-SA')}`);
    console.log(`صالح لمدة 15 دقيقة`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
}

class ResendEmailService implements EmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendOTP(to: string, otp: string, expiresAt: number): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'أكاديمية تراث الحنابلة <noreply@hanbaliacademy.com>',
          to: [to],
          subject: 'رمز التحقق - أكاديمية تراث الحنابلة',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a8a; margin-bottom: 10px;">أكاديمية تراث الحنابلة</h1>
                <p style="color: #64748b; font-size: 16px;">لوحة الإدارة</p>
              </div>
              
              <div style="background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-bottom: 20px;">رمز التحقق الخاص بك</h2>
                <div style="background: white; border: 2px solid #1e3a8a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 14px;">
                  هذا الرمز صالح لمدة 15 دقيقة فقط
                </p>
                <p style="color: #64748b; font-size: 14px;">
                  ينتهي في: ${new Date(expiresAt).toLocaleString('ar-SA')}
                </p>
              </div>
              
              <div style="background: #fef3cd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  ⚠️ لا تشارك هذا الرمز مع أي شخص آخر. فريق أكاديمية تراث الحنابلة لن يطلب منك هذا الرمز أبداً.
                </p>
              </div>
              
              <div style="text-align: center; color: #64748b; font-size: 12px;">
                <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
                <p>© 2024 أكاديمية تراث الحنابلة. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send email via Resend:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      return false;
    }
  }
}

// Initialize email service based on environment
function getEmailService(): EmailService {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (resendApiKey && process.env.NODE_ENV === 'production') {
    return new ResendEmailService(resendApiKey);
  } else {
    // Use mock service in development
    return new MockEmailService();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب', code: 'EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صحيحة', code: 'INVALID_EMAIL_FORMAT' },
        { status: 400 }
      );
    }

    // Check if email is authorized admin email
    const { isAdmin } = await fetchQuery(api.otp.isAdminEmail, { email });
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير مصرح له بالوصول للوحة الإدارة', code: 'UNAUTHORIZED_EMAIL' },
        { status: 403 }
      );
    }

    // Generate OTP in database
    const otpResult = await fetchMutation(api.otp.generateAdminOTP, { email });

    // Send OTP via email
    const emailService = getEmailService();
    const emailSent = await emailService.sendOTP(email, otpResult.otp, otpResult.expiresAt);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'فشل في إرسال رمز التحقق. يرجى المحاولة مرة أخرى', code: 'EMAIL_SEND_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: otpResult.message,
      expiresAt: otpResult.expiresAt,
    });

  } catch (error: any) {
    console.error('Error in send-otp API:', error);

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