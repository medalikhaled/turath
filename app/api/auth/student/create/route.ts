import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { PasswordService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, courses } = await request.json();

    // Enhanced input validation using AuthErrorHandler
    if (!email || !name || !password) {
      const error = AuthErrorHandler.createError(AuthErrorCode.MISSING_REQUIRED_FIELD, {
        field: !email ? 'email' : !name ? 'name' : 'password'
      });
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_EMAIL);
      return NextResponse.json(
        { error: error.messageAr, code: error.code },
        { status: error.statusCode }
      );
    }

    // Validate password strength using OSLOJS PasswordService
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = AuthErrorHandler.createError(AuthErrorCode.WEAK_PASSWORD, {
        validationErrors: passwordValidation.errorsAr.map((msg: string, index: number) => ({
          field: 'password',
          message: passwordValidation.errors[index],
          messageAr: msg
        }))
      });
      return NextResponse.json(
        { error: error.messageAr, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    // Hash the password using OSLOJS PasswordService
    const hashedPassword = await PasswordService.hashPassword(password);

    // Create student with hashed password using students mutation
    const result = await convex.mutation(api.students.createStudentWithUser, {
      email: email.toLowerCase().trim(),
      name,
      password: hashedPassword,
      courses: courses || [],
    });

    return NextResponse.json({
      success: true,
      message: 'Student created successfully',
      studentId: result.studentId,
      userId: result.userId,
    });
  } catch (error: any) {
    console.error('Student creation error:', error);

    // Use AuthErrorHandler for comprehensive error handling
    const authError = AuthErrorHandler.handleError(error, 'student-creation');
    
    return NextResponse.json(
      { 
        error: authError.messageAr, 
        code: authError.code,
        details: authError.details 
      },
      { status: authError.statusCode || 500 }
    );
  }
}