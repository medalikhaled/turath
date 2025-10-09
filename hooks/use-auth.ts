"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  courses?: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionType: 'student' | 'admin' | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginCredentials {
  email: string;
  otp: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionType: null,
  });
  
  const router = useRouter();

  // Validate current session with enhanced error handling
  const validateSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
            sessionType: data.sessionType,
          });
          return true;
        }
      }

      // Session invalid or expired - clear any existing state
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });
      
      // Clear any stale cookies on client side
      if (typeof document !== 'undefined') {
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });
      return false;
    }
  }, []);

  // Student login with enhanced error handling and validation
  const loginStudent = useCallback(async (credentials: LoginCredentials) => {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        const errorMessage = 'البريد الإلكتروني وكلمة المرور مطلوبان';
        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: 'MISSING_FIELDS' };
      }

      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          sessionType: 'student',
        });

        toast.success(data.message || 'تم تسجيل الدخول بنجاح');
        
        // Redirect to dashboard or intended page
        const intendedPath = sessionStorage.getItem('intended-path');
        if (intendedPath) {
          sessionStorage.removeItem('intended-path');
          router.push(intendedPath);
        } else {
          router.push('/dashboard');
        }
        
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        
        // Enhanced error messages based on error codes
        let errorMessage = data.error || 'حدث خطأ في تسجيل الدخول';
        
        switch (data.code) {
          case 'INVALID_CREDENTIALS':
            errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            break;
          case 'STUDENT_INACTIVE':
            errorMessage = 'حساب الطالب غير نشط. يرجى التواصل مع الإدارة';
            break;
          case 'MISSING_FIELDS':
            errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
            break;
          default:
            errorMessage = data.error || 'حدث خطأ في تسجيل الدخول';
        }
        
        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: data.code };
      }
    } catch (error) {
      console.error('Student login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = 'حدث خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [router]);

  // Admin login
  const loginAdmin = useCallback(async (credentials: AdminLoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          sessionType: 'admin',
        });

        toast.success(data.message || 'تم تسجيل الدخول بنجاح');
        router.push('/admin/dashboard');
        return { success: true, sessionId: data.sessionId };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        const errorMessage = data.error || 'حدث خطأ في تسجيل الدخول';
        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: data.code };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = 'حدث خطأ في الاتصال';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [router]);

  // Enhanced logout with thorough cleanup
  const logout = useCallback(async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear local state
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });

      // Clear any client-side storage
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might contain auth data
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-token');
        sessionStorage.removeItem('intended-path');
        
        // Clear auth cookie on client side as backup
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout API fails, clear local state
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });
      
      // Clear client-side data anyway
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-token');
        sessionStorage.removeItem('intended-path');
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      toast.success('تم تسجيل الخروج');
      router.push('/login');
    }
  }, [router]);

  // Check authentication status on mount
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Require authentication with enhanced role-based access control
  const requireAuth = useCallback((requiredRole?: 'student' | 'admin') => {
    if (!authState.isAuthenticated) {
      toast.error('يجب تسجيل الدخول للوصول لهذه الصفحة');
      router.push('/login');
      return false;
    }

    if (requiredRole && authState.user?.role !== requiredRole) {
      // Special case: allow admins to access student routes
      if (requiredRole === 'student' && authState.user?.role === 'admin') {
        return true;
      }
      
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      
      // Enhanced redirection logic
      if (authState.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (authState.user?.role === 'student') {
        router.push('/dashboard');
      } else {
        // Fallback for unknown roles
        router.push('/login');
      }
      return false;
    }

    return true;
  }, [authState.isAuthenticated, authState.user?.role, router]);

  return {
    ...authState,
    loginStudent,
    loginAdmin,
    logout,
    validateSession,
    requireAuth,
  };
}