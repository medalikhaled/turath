import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyPassword, generateToken, TokenPayload } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني وكلمة المرور مطلوبان', code: 'MISSING_FIELDS' },
                { status: 400 }
            );
        }

        // Get student for authentication
        const student = await convex.query(api.studentAuth.getStudentForAuth, {
            email: email.toLowerCase().trim(),
        });

        if (!student) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await verifyPassword(password, student.hashedPassword);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const tokenPayload: TokenPayload = {
            userId: student.id,
            email: student.email,
            role: 'student',
            sessionType: 'student',
        };

        const token = await generateToken(tokenPayload);

        // Create session in Convex
        await convex.mutation(api.auth.createStudentSession, {
            studentId: student.id,
            sessionData: {
                userId: student.id,
                email: student.email,
                role: 'student',
                sessionType: 'student',
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Update last login
        await convex.mutation(api.auth.updateStudentLastLogin, {
            studentId: student.id,
        });

        // Create response with token in cookie
        const response = NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: student.id,
                email: student.email,
                name: student.name,
                role: student.role,
                courses: student.courses,
            },
            token,
        });

        // Set HTTP-only cookie for additional security
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Student login error:', error);

        if (error.message?.includes('INVALID_CREDENTIALS')) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', code: 'INVALID_CREDENTIALS' },
                { status: 401 }
            );
        }

        if (error.message?.includes('STUDENT_INACTIVE')) {
            return NextResponse.json(
                { error: 'حساب الطالب غير نشط', code: 'STUDENT_INACTIVE' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'حدث خطأ في تسجيل الدخول', code: 'LOGIN_ERROR' },
            { status: 500 }
        );
    }
}