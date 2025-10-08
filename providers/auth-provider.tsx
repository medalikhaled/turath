"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthState, LoginCredentials, AdminLoginCredentials, User } from '@/hooks/use-auth';

interface AuthContextType extends AuthState {
  loginStudent: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; code?: string }>;
  loginAdmin: (credentials: AdminLoginCredentials) => Promise<{ success: boolean; error?: string; code?: string; sessionId?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  requireAuth: (requiredRole?: 'student' | 'admin') => boolean;
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