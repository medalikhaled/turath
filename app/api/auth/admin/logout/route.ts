import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('admin-session')?.value;

    if (token) {
      try {
        // Decode token to get email
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        if (payload.email && payload.role === 'admin') {
          // Logout admin session in database
          await fetchMutation(api.otp.logoutAdmin, {
            email: payload.email as string,
          });
        }
      } catch (jwtError) {
        // Token is invalid, but we'll still clear the cookie
        console.log('Invalid token during logout, clearing cookie anyway');
      }
    }

    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

    // Clear the session cookie
    response.cookies.delete('admin-session');

    return response;

  } catch (error: any) {
    console.error('Error in logout API:', error);

    // Even if there's an error, we should clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });

    response.cookies.delete('admin-session');
    return response;
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}