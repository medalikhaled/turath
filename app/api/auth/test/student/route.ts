import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyToken } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token found',
        authenticated: false,
      });
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
        authenticated: false,
      });
    }

    // Get student data
    let studentData = null;
    if (payload.role === 'student') {
      studentData = await convex.query(api.auth.getStudentById, {
        studentId: payload.userId as any,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      tokenPayload: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionType: payload.sessionType,
      },
      studentData,
      message: 'Authentication test successful',
    });
  } catch (error: any) {
    console.error('Authentication test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Authentication test failed',
      authenticated: false,
    }, { status: 500 });
  }
}