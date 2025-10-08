import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { hashPassword } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // This is a development endpoint to test authentication
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'هذا الطريق متاح فقط في بيئة التطوير' },
        { status: 403 }
      );
    }

    // Get all students to check their status
    const students = await convex.query(api.studentAuth.getAllStudents);

    return NextResponse.json({
      success: true,
      message: 'نظام المصادقة يعمل بشكل صحيح',
      studentsCount: students.length,
      students: students.map(student => ({
        id: student.id,
        email: student.email,
        name: student.name,
        isActive: student.isActive,
        coursesCount: student.courses.length,
      })),
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    
    return NextResponse.json(
      { error: 'حدث خطأ في اختبار نظام المصادقة', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint creates a test student for development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'هذا الطريق متاح فقط في بيئة التطوير' },
        { status: 403 }
      );
    }

    const { action, email, name, password } = await request.json();

    if (action === 'create-test-student') {
      if (!email || !name || !password) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني والاسم وكلمة المرور مطلوبة' },
          { status: 400 }
        );
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create test student
      const result = await convex.mutation(api.studentAuth.createStudentWithPassword, {
        email: email.toLowerCase().trim(),
        name,
        password: hashedPassword,
        courses: [],
      });

      return NextResponse.json({
        success: true,
        message: 'تم إنشاء طالب تجريبي بنجاح',
        studentId: result.studentId,
        credentials: {
          email: email.toLowerCase().trim(),
          password: password, // Return plain password for testing
        },
      });
    }

    return NextResponse.json(
      { error: 'إجراء غير صالح' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Test student creation error:', error);
    
    if (error.message?.includes('STUDENT_EXISTS')) {
      return NextResponse.json(
        { error: 'الطالب التجريبي موجود بالفعل' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء الطالب التجريبي', details: error.message },
      { status: 500 }
    );
  }
}