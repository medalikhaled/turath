import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyPassword, generateToken, TokenPayload } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Enhanced input validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني وكلمة المرور مطلوبان', code: 'MISSING_FIELDS' },
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

        // Verify credentials using the enhanced function
        const result = await convex.mutation(api.students.verifyStudentCredentials, {
            email: email.toLowerCase().trim(),
            password,
        });

        if (!result) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }

        const { user, student } = result;

        // Generate JWT token with enhanced payload
        const tokenPayload: TokenPayload = {
            userId: student._id,
            email: student.email,
            role: 'student',
            sessionType: 'student',
        };

        const token = await generateToken(tokenPayload);

        // Create session in Convex with enhanced data
        await convex.mutation(api.auth.createStudentSession, {
            studentId: student._id,
            sessionData: {
                userId: student._id,
                email: student.email,
                role: 'student',
                sessionType: 'student',
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Create response with enhanced user data
        const response = NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: student._id,
                email: student.email,
                name: student.name,
                role: 'student',
                courses: student.courses,
                enrollmentDate: student.enrollmentDate,
                lastLogin: student.lastLogin,
            },
            token,
            sessionType: 'student',
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
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

        // Enhanced error handling with specific error codes
        if (error.message?.includes('INVALID_CREDENTIALS')) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }

        if (error.message?.includes('STUDENT_INACTIVE')) {
            return NextResponse.json(
                { error: 'حساب الطالب غير نشط. يرجى التواصل مع الإدارة', code: 'STUDENT_INACTIVE' },
                { status: 403 }
            );
        }

        if (error.message?.includes('INVALID_EMAIL_FORMAT')) {
            return NextResponse.json(
                { error: 'صيغة البريد الإلكتروني غير صحيحة', code: 'INVALID_EMAIL_FORMAT' },
                { status: 400 }
            );
        }

        // Rate limiting error (if implemented)
        if (error.message?.includes('TOO_MANY_ATTEMPTS')) {
            return NextResponse.json(
                { error: 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً', code: 'TOO_MANY_ATTEMPTS' },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: 'حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى', code: 'LOGIN_ERROR' },
            { status: 500 }
        );
    }
}