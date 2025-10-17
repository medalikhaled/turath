import { ReactNode } from 'react';
import { AuthProvider } from '@/providers/auth-provider';
import { getInitialAuthState } from '@/lib/auth-server-actions';

interface AuthLayoutWrapperProps {
  children: ReactNode;
}

export default async function AuthLayoutWrapper({ children }: AuthLayoutWrapperProps) {
  // Get initial auth state from server to avoid client-side validation call
  const initialAuthState = await getInitialAuthState();
  
  return (
    <AuthProvider initialAuthState={initialAuthState}>
      {children}
    </AuthProvider>
  );
}