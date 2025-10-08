import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyToken } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.replace('Bearer ', '') || cookieToken;
    
    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'لم يتم العثور على رمز المصادقة', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { valid: false, error: 'رمز المصادقة غير صالح', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Get user data from database to ensure user still exists and is active
    let userData = null;
    
    if (payload.role === 'student') {
      userData = await convex.query(api.auth.getStudentById, {
        studentId: payload.userId as any,
      });
    } else if (payload.role === 'admin') {
      userData = await convex.query(api.auth.getAdminByEmail, {
        email: payload.email,
      });
    }

    if (!userData) {
      return NextResponse.json(
        { valid: false, error: 'المستخدم غير موجود أو غير نشط', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Return valid session data
    const userResponse: any = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    };

    // Add courses only for students
    if (payload.role === 'student' && 'courses' in userData) {
      userResponse.courses = userData.courses;
    }

    return NextResponse.json({
      valid: true,
      user: userResponse,
      sessionType: payload.sessionType,
      expiresAt: payload.exp ? payload.exp * 1000 : null, // Convert to milliseconds
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    
    return NextResponse.json(
      { valid: false, error: 'خطأ في التحقق من الجلسة', code: 'VALIDATION_ERROR' },
      { status: 500 }
    );
  }
}