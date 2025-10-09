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
      // Clear invalid token cookie
      const response = NextResponse.json(
        { valid: false, error: 'رمز المصادقة غير صالح أو منتهي الصلاحية', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Get user data from database to ensure user still exists and is active
    let userData = null;
    
    try {
      if (payload.role === 'student') {
        userData = await convex.query(api.auth.getStudentById, {
          studentId: payload.userId as any,
        });
      } else if (payload.role === 'admin') {
        userData = await convex.query(api.auth.getAdminByEmail, {
          email: payload.email,
        });
      }
    } catch (dbError) {
      console.error('Database error during session validation:', dbError);
      return NextResponse.json(
        { valid: false, error: 'خطأ في قاعدة البيانات', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    if (!userData) {
      // Clear token for non-existent or inactive user
      const response = NextResponse.json(
        { valid: false, error: 'المستخدم غير موجود أو غير نشط', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
      
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      
      return response;
    }

    // Return enhanced session data
    const userResponse: any = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: payload.role, // Use role from token for consistency
    };

    // Add role-specific data
    if (payload.role === 'student' && 'courses' in userData) {
      userResponse.courses = userData.courses;
      // Add enrollmentDate if it exists in the userData
      if ('enrollmentDate' in userData) {
        userResponse.enrollmentDate = userData.enrollmentDate;
      }
    }

    return NextResponse.json({
      valid: true,
      user: userResponse,
      sessionType: payload.sessionType,
      expiresAt: payload.exp ? payload.exp * 1000 : null, // Convert to milliseconds
      issuedAt: payload.iat ? payload.iat * 1000 : null,
      tokenValid: true,
    });
  } catch (error: any) {
    console.error('Session validation error:', error);
    
    // Clear potentially corrupted token
    const response = NextResponse.json(
      { valid: false, error: 'خطأ في التحقق من الجلسة', code: 'VALIDATION_ERROR' },
      { status: 500 }
    );
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}