"use client";

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { AuthErrorDisplay } from '@/components/auth/auth-error-display';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
  fallback?: React.ReactNode;
  showErrorDetails?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback,
  showErrorDetails = true
}: ProtectedRouteProps) {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    requireAuth, 
    error, 
    clearError,
    sessionExpiresAt 
  } = useAuthContext();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      requireAuth(requiredRole);
      setHasCheckedAuth(true);
    }
  }, [isLoading, requireAuth, requiredRole, hasCheckedAuth]);

  // Check for session expiration
  useEffect(() => {
    if (sessionExpiresAt && Date.now() >= sessionExpiresAt) {
      // Session has expired, redirect to login
      router.push('/login');
    }
  }, [sessionExpiresAt, router]);

  // Show loading spinner while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            </div>
            <div className="space-y-2">
              <p className="text-white font-arabic text-lg">جاري التحقق من الهوية...</p>
              <p className="text-blue-200 font-arabic text-sm">يرجى الانتظار</p>
            </div>
          </div>
        </div>
      )
    );
  }

  // Show error if authentication failed
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600/20 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-arabic mb-2">
              غير مصرح بالدخول
            </h2>
            <p className="text-red-200 font-arabic text-sm">
              يجب تسجيل الدخول للوصول إلى هذه الصفحة
            </p>
          </div>

          {showErrorDetails && error && (
            <AuthErrorDisplay
              error={error}
              onDismiss={clearError}
              showRetryButton={false}
            />
          )}

          <div className="text-center">
            <Button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-arabic"
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check role permissions
  if (requiredRole && user?.role !== requiredRole) {
    // Special case: allow admins to access student routes
    if (requiredRole === 'student' && user?.role === 'admin') {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/20 mb-4">
              <Shield className="h-6 w-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white font-arabic mb-2">
              صلاحيات غير كافية
            </h2>
            <p className="text-amber-200 font-arabic text-sm">
              ليس لديك الصلاحية للوصول إلى هذه الصفحة
            </p>
          </div>

          <div className="text-center space-y-2">
            <Button
              onClick={() => {
                const defaultPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
                router.push(defaultPath);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-arabic"
            >
              العودة إلى لوحة التحكم
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full border-white/20 text-white hover:bg-white/10 font-arabic"
            >
              تسجيل الدخول بحساب آخر
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function StudentProtectedRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  const { isLoading, isAuthenticated, user, requireAuth } = useAuthContext();

  useEffect(() => {
    if (!isLoading) {
      // Allow both students and admins to access student routes
      if (!isAuthenticated) {
        requireAuth();
      } else if (user?.role !== 'student' && user?.role !== 'admin') {
        requireAuth('student'); // This will redirect to appropriate page
      }
    }
  }, [isLoading, isAuthenticated, user, requireAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white font-arabic">جاري التحقق من الهوية...</p>
          </div>
        </div>
      )
    );
  }

  // Allow both students and admins to access student routes
  if (!isAuthenticated || (user?.role !== 'student' && user?.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}

export function AdminProtectedRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}