import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مطلوب', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    // Use the existing OTP generation function
    const result = await convex.mutation(api.otp.generateAdminOTP, {
      email: email.toLowerCase().trim(),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('OTP request error:', error);
    
    if (error.message?.includes('UNAUTHORIZED')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير مصرح له بالوصول للوحة الإدارة', code: 'UNAUTHORIZED' },
        { status: 403 }
      );
    }

    if (error.message?.includes('RATE_LIMITED')) {
      return NextResponse.json(
        { error: 'يرجى الانتظار قبل طلب رمز جديد', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في طلب رمز التحقق', code: 'REQUEST_ERROR' },
      { status: 500 }
    );
  }
}