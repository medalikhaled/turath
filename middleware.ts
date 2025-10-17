import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/course', '/admin', '/profile', '/settings'];
const publicRoutes = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Store intended path for redirect after login
    response.cookies.set('intended-path', pathname, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/',
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
