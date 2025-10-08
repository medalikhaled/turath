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

  // Validate current session
  const validateSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
            sessionType: data.sessionType,
          });
          return true;
        }
      }

      // Session invalid or expired
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });
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

  // Student login
  const loginStudent = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/student/login', {
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
          sessionType: 'student',
        });

        toast.success(data.message || 'تم تسجيل الدخول بنجاح');
        router.push('/dashboard');
        return { success: true };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        const errorMessage = data.error || 'حدث خطأ في تسجيل الدخول';
        toast.error(errorMessage);
        return { success: false, error: errorMessage, code: data.code };
      }
    } catch (error) {
      console.error('Student login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = 'حدث خطأ في الاتصال';
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

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });

      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionType: null,
      });
      router.push('/login');
    }
  }, [router]);

  // Check authentication status on mount
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // Require authentication
  const requireAuth = useCallback((requiredRole?: 'student' | 'admin') => {
    if (!authState.isAuthenticated) {
      router.push('/login');
      return false;
    }

    if (requiredRole && authState.user?.role !== requiredRole) {
      toast.error('غير مصرح لك بالوصول لهذه الصفحة');
      router.push(authState.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
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