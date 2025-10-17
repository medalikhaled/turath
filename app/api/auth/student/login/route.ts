import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';
import { AuthErrorHandler, AuthErrorCode } from '@/lib/auth-error-handler';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Enhanced input validation using AuthErrorHandler
        if (!email || !password) {
            const error = AuthErrorHandler.createError(AuthErrorCode.MISSING_REQUIRED_FIELD);
            return NextResponse.json(
                { error: error.messageAr, code: error.code },
                { status: error.statusCode }
            );
        }

        // Validate email format
        const emailValidationError = AuthErrorHandler.createError(AuthErrorCode.INVALID_EMAIL);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: emailValidationError.messageAr, code: emailValidationError.code },
                { status: emailValidationError.statusCode }
            );
        }

        // Get student credentials from Convex
        const studentData = await convex.query(api.authFunctions.getStudentCredentials, {
            email: email.toLowerCase().trim(),
        });

        if (!studentData) {
            const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_CREDENTIALS);
            return NextResponse.json(
                { error: error.messageAr, code: error.code },
                { status: error.statusCode }
            );
        }

        // Verify password using OSLOJS
        const { PasswordService } = await import('@/lib/oslojs-services');
        const isPasswordValid = await PasswordService.verifyPassword(password, studentData.passwordHash || '');

        if (!isPasswordValid) {
            const error = AuthErrorHandler.createError(AuthErrorCode.INVALID_CREDENTIALS);
            return NextResponse.json(
                { error: error.messageAr, code: error.code },
                { status: error.statusCode }
            );
        }

        // Generate JWT token using OSLOJS SessionService
        const tokenResult = await SessionService.createSession({
            userId: studentData.studentId,
            email: studentData.email,
            role: 'student',
        });

        const token = tokenResult.token;

        // Update student last login
        await convex.mutation(api.authFunctions.updateStudentLastLogin, {
            studentId: studentData.studentId,
        });

        // Create response with enhanced user data
        const response = NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: studentData.studentId,
                email: studentData.email,
                name: studentData.name,
                role: 'student',
                courses: studentData.courses,
            },
            token,
            sessionType: 'student',
            expiresAt: tokenResult.expiresAt.getTime(),
        });

        // Set HTTP-only cookie with enhanced security
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // Clear intended path cookie if it exists
        const intendedPath = request.cookies.get('intended-path')?.value;
        if (intendedPath) {
            response.cookies.set('intended-path', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 0,
                path: '/',
            });
        }

        return response;
    } catch (error: any) {
        console.error('Student login error:', error);

        // Use AuthErrorHandler for comprehensive error handling
        const authError = AuthErrorHandler.handleError(error, 'student-login');

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