import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// Define protected routes
const protectedRoutes = {
  student: ['/dashboard', '/course'],
  admin: ['/admin'],
  both: ['/profile'],
};

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isStudentRoute = protectedRoutes.student.some(route => pathname.startsWith(route));
  const isAdminRoute = protectedRoutes.admin.some(route => pathname.startsWith(route));
  const isBothRoute = protectedRoutes.both.some(route => pathname.startsWith(route));

  if (!isStudentRoute && !isAdminRoute && !isBothRoute) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    // Store intended path for redirect after login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('intended-path', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });
    return response;
  }

  // Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    // Token is invalid, clear it and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    response.cookies.set('intended-path', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    });
    return response;
  }

  // Enhanced role-based access control
  if (isStudentRoute && payload.role !== 'student' && payload.role !== 'admin') {
    // Student route accessed by unauthorized user
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminRoute && payload.role !== 'admin') {
    // Admin route accessed by non-admin
    if (payload.role === 'student') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add enhanced user info to request headers for use in components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-session-type', payload.sessionType);
  
  // Add timestamp for session tracking
  requestHeaders.set('x-auth-timestamp', Date.now().toString());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};