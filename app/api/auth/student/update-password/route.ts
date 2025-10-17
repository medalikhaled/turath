import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { PasswordService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';
import { withAdminAuth } from '@/lib/auth-middleware';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { studentId, newPassword } = await request.json();

    // Enhanced input validation using AuthErrorHandler
    if (!studentId || !newPassword) {
      const error = AuthErrorHandler.createError(AuthErrorCode.MISSING_REQUIRED_FIELD, {
        field: !studentId ? 'studentId' : 'newPassword'
      });
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Validate password strength using OSLOJS PasswordService
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      const error = AuthErrorHandler.createError(AuthErrorCode.WEAK_PASSWORD, {
        validationErrors: passwordValidation.errorsAr.map((msg: string, index: number) => ({
          field: 'newPassword',
          message: passwordValidation.errors[index],
          messageAr: msg
        }))
      });
      return NextResponse.json(
        { error: error.messageAr, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    // Hash the new password using OSLOJS PasswordService
    const hashedPassword = await PasswordService.hashPassword(newPassword);

    // Update student password using students mutation
    const result = await convex.mutation(api.students.resetStudentPassword, {
      studentId,
      newPassword: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Password update error:', error);

    // Use AuthErrorHandler for comprehensive error handling
    const authError = AuthErrorHandler.handleError(error, 'student-password-update');
    
    return NextResponse.json(
      { 
        error: authError.messageAr, 
        code: authError.code,
        details: authError.details 
      },
      { status: authError.statusCode || 500 }
    );
  }
});