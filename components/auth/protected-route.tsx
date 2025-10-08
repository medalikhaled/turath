"use client";

import { useEffect } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user, requireAuth } = useAuthContext();

  useEffect(() => {
    if (!isLoading) {
      requireAuth(requiredRole);
    }
  }, [isLoading, requireAuth, requiredRole]);

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

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function StudentProtectedRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="student" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminProtectedRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}