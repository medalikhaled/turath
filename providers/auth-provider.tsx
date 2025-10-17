"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState, LoginCredentials, AdminLoginCredentials, User, AuthResult } from '@/hooks/use-auth';
import { AuthError } from '@/lib/auth-error-handler';

interface AuthContextType extends AuthState {
  loginStudent: (credentials: LoginCredentials) => Promise<AuthResult>;
  loginAdmin: (credentials: AdminLoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  requireAuth: (requiredRole?: 'student' | 'admin') => boolean;
  refreshSession: () => Promise<boolean>;
  sendOTP: (email: string) => Promise<{ success: boolean; message?: string; error?: string; expiresIn?: number; retryAfter?: number }>;
  clearError: () => void;
  // Enhanced loading state getters for better UX
  isPerformingAuth: boolean;
  canPerformActions: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for specific roles
export function useStudentAuth() {
  const auth = useAuthContext();
  
  React.useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && auth.user?.role !== 'student') {
      auth.logout();
    }
  }, [auth]);

  return auth;
}

export function useAdminAuth() {
  const auth = useAuthContext();
  
  React.useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && auth.user?.role !== 'admin') {
      auth.logout();
    }
  }, [auth]);

  return auth;
}