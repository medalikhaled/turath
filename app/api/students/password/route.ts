import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// POST - Reset student password
export async function POST(request: NextRequest) {
  try {
    const { action, studentId, newPassword, currentPassword, email } = await request.json();

    if (action === 'reset') {
      // Admin resetting student password
      if (!studentId || !newPassword) {
        return NextResponse.json(
          { error: 'معرف الطالب وكلمة المرور الجديدة مطلوبان', code: 'REQUIRED_FIELDS' },
          { status: 400 }
        );
      }

      // Validate password strength
      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل', code: 'WEAK_PASSWORD' },
          { status: 400 }
        );
      }

      const result = await convex.mutation(api.students.resetStudentPassword, {
        studentId,
        newPassword,
      });

      return NextResponse.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح',
      });

    } else if (action === 'change') {
      // Student changing their own password
      if (!email || !currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'جميع الحقول مطلوبة لتغيير كلمة المرور', code: 'REQUIRED_FIELDS' },
          { status: 400 }
        );
      }

      // Validate new password strength
      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل', code: 'WEAK_PASSWORD' },
          { status: 400 }
        );
      }

      // Verify current password first
      const credentials = await convex.mutation(api.students.verifyStudentCredentials, {
        email,
        password: currentPassword,
      });

      if (!credentials) {
        return NextResponse.json(
          { error: 'كلمة المرور الحالية غير صحيحة', code: 'INVALID_CURRENT_PASSWORD' },
          { status: 401 }
        );
      }

      // Update password
      const result = await convex.mutation(api.students.resetStudentPassword, {
        studentId: credentials.student._id,
        newPassword,
      });

      return NextResponse.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح',
      });

    } else {
      return NextResponse.json(
        { error: 'إجراء غير صالح', code: 'INVALID_ACTION' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in password management:', error);
    return NextResponse.json(
      { error: 'خطأ في إدارة كلمة المرور', code: 'PASSWORD_ERROR' },
      { status: 500 }
    );
  }
}