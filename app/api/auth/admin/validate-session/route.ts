import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
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
    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload;
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'جلسة غير صالحة', code: 'INVALID_SESSION' },
        { status: 401 }
      );
    }

    if (decoded.role !== 'admin' || decoded.sessionType !== 'admin') {
      return NextResponse.json(
        { error: 'نوع الجلسة غير صحيح', code: 'INVALID_SESSION_TYPE' },
        { status: 401 }
      );
    }

    // Validate session in database
    const sessionValidation = await fetchQuery(api.otp.validateAdminSession, {
      email: decoded.email,
    });

    if (!sessionValidation.isValid) {
      // Clear invalid cookie
      const response = NextResponse.json(
        { error: 'انتهت صلاحية الجلسة', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
      
      response.cookies.delete('admin-session');
      return response;
    }

    // Update session last access time
    await fetchMutation(api.otp.updateAdminSessionAccess, {
      email: decoded.email,
    });

    return NextResponse.json({
      success: true,
      user: {
        email: decoded.email,
        role: 'admin',
        sessionId: decoded.sessionId,
      },
      session: sessionValidation.session,
    });

  } catch (error: any) {
    console.error('Error in validate-session API:', error);

    // Handle Convex errors
    if (error.data?.code) {
      return NextResponse.json(
        { error: error.data.message, code: error.data.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}