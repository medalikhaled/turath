import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { SessionService } from '@/lib/oslojs-services';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export interface ServerAuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    courses?: string[];
  } | null;
  sessionType: 'student' | 'admin' | null;
  expiresAt: number | null;
}

/**
 * Server-side function to get initial auth state
 * This reduces the need for client-side validation calls
 */
export async function getInitialAuthState(): Promise<ServerAuthState> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
        sessionType: null,
        expiresAt: null,
      };
    }

    // Verify JWT token using OSLOJS SessionService
    const sessionValidation = await SessionService.verifySession(token);
    
    if (!sessionValidation.isValid || !sessionValidation.payload) {
      return {
        isAuthenticated: false,
        user: null,
        sessionType: null,
        expiresAt: null,
      };
    }

    const payload = sessionValidation.payload;

    // Get user data from database
    const userData = await convex.query(api.authFunctions.getUserByEmail, {
      email: payload.email,
    });

    if (!userData) {
      return {
        isAuthenticated: false,
        user: null,
        sessionType: null,
        expiresAt: null,
      };
    }

    // Return user data
    const userResponse: any = {
      id: userData.userId, // This is the correct users table ID
      email: userData.email,
      name: userData.name || '',
      role: payload.role,
    };

    // Add role-specific data
    if (userData.role === 'student' && 'courses' in userData) {
      userResponse.courses = userData.courses;
    }

    return {
      isAuthenticated: true,
      user: userResponse,
      sessionType: payload.role,
      expiresAt: payload.exp ? payload.exp * 1000 : null,
    };
  } catch (error) {
    console.error('Server auth state error:', error);
    return {
      isAuthenticated: false,
      user: null,
      sessionType: null,
      expiresAt: null,
    };
  }
}