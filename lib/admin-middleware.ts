import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function validateAdminMiddleware(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'لا توجد جلسة نشطة', code: 'NO_SESSION' },
        { status: 401 }
      );
    }

    // Verify JWT token
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (payload.role !== 'admin' || payload.sessionType !== 'admin') {
        return NextResponse.json(
          { error: 'نوع الجلسة غير صحيح', code: 'INVALID_SESSION_TYPE' },
          { status: 401 }
        );
      }

      // Add user info to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-admin-email', payload.email as string);
      response.headers.set('x-admin-session-id', payload.sessionId as string);
      
      return response;

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'جلسة غير صالحة', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Error in admin middleware:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Helper function to check if a path requires admin authentication
export function isAdminPath(pathname: string): boolean {
  const adminPaths = [
    '/admin',
    '/api/admin',
  ];

  return adminPaths.some(path => pathname.startsWith(path));
}

// Helper function to check if a path is an admin auth endpoint (should not be protected)
export function isAdminAuthPath(pathname: string): boolean {
  const authPaths = [
    '/api/auth/admin/send-otp',
    '/api/auth/admin/verify-otp',
    '/api/auth/admin/validate-session',
    '/api/auth/admin/logout',
  ];

  return authPaths.includes(pathname);
}