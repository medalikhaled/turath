import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

// Middleware to check authentication
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get token from Authorization header or cookies
      const authHeader = req.headers.get('authorization');
      const cookieToken = req.cookies.get('auth-token')?.value;
      
      const token = authHeader?.replace('Bearer ', '') || cookieToken;
      
      if (!token) {
        return NextResponse.json(
          { error: 'غير مصرح - لم يتم العثور على رمز المصادقة', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = await verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: 'غير مصرح - رمز المصادقة غير صالح', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      // Add user to request
      (req as AuthenticatedRequest).user = payload;
      
      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'خطأ في المصادقة', code: 'AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

// Middleware to check admin role
export function withAdminAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    if (req.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح - يتطلب صلاحيات إدارية', code: 'ADMIN_REQUIRED' },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}

// Middleware to check student role
export function withStudentAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    if (req.user?.role !== 'student') {
      return NextResponse.json(
        { error: 'غير مصرح - يتطلب صلاحيات طالب', code: 'STUDENT_REQUIRED' },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}