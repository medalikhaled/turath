import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { hashPassword } from '@/lib/auth';
import { withAdminAuth } from '@/lib/auth-middleware';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { studentId, newPassword } = await request.json();

    if (!studentId || !newPassword) {
      return NextResponse.json(
        { error: 'معرف الطالب وكلمة المرور الجديدة مطلوبان', code: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update student password
    const result = await convex.mutation(api.studentAuth.updateStudentPassword, {
      studentId,
      newPassword: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Password update error:', error);

    if (error.message?.includes('STUDENT_NOT_FOUND')) {
      return NextResponse.json(
        { error: 'الطالب غير موجود', code: 'STUDENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في تحديث كلمة المرور', code: 'UPDATE_ERROR' },
      { status: 500 }
    );
  }
});