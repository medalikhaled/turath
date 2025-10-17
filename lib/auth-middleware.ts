import { NextRequest, NextResponse } from 'next/server';
import { validateSession, AuthErrorCode, type SessionPayload } from './auth-service';

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionPayload;
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
          { 
            error: 'غير مصرح - لم يتم العثور على رمز المصادقة',
            code: AuthErrorCode.UNAUTHORIZED 
          },
          { status: 401 }
        );
      }

      // Verify token
      const sessionResult = await validateSession(token);
      if (!sessionResult.success || !sessionResult.data) {
        return NextResponse.json(
          { 
            error: sessionResult.error?.messageAr || 'غير مصرح - رمز المصادقة غير صالح',
            code: sessionResult.error?.code || AuthErrorCode.SESSION_EXPIRED 
          },
          { status: 401 }
        );
      }

      // Add user to request
      (req as AuthenticatedRequest).user = sessionResult.data;
      
      return handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      return NextResponse.json(
        { 
          error: 'خطأ في المصادقة',
          code: AuthErrorCode.UNAUTHORIZED 
        },
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
        { 
          error: 'غير مصرح - يتطلب صلاحيات مدير',
          code: AuthErrorCode.UNAUTHORIZED 
        },
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
        { 
          error: 'غير مصرح - يتطلب صلاحيات طالب',
          code: AuthErrorCode.UNAUTHORIZED 
        },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}