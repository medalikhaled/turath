import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { hashPassword } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, courses } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني والاسم وكلمة المرور مطلوبة', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create student with hashed password
    const result = await convex.mutation(api.studentAuth.createStudentWithPassword, {
      email: email.toLowerCase().trim(),
      name,
      password: hashedPassword,
      courses: courses || [],
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      studentId: result.studentId,
    });
  } catch (error: any) {
    console.error('Student creation error:', error);

    if (error.message?.includes('STUDENT_EXISTS')) {
      return NextResponse.json(
        { error: 'الطالب موجود بالفعل', code: 'STUDENT_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء حساب الطالب', code: 'CREATION_ERROR' },
      { status: 500 }
    );
  }
}