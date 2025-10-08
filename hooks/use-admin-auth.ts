import { useState, useEffect } from 'react';

interface AdminUser {
  email: string;
  role: 'admin';
  sessionId: string;
}

interface AdminSession {
  id: string;
  email: string;
  expiresAt: number;
  createdAt: number;
  lastAccessAt: number;
}

interface UseAdminAuthReturn {
  user: AdminUser | null;
  session: AdminSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount and periodically
  useEffect(() => {
    checkSession();
    
    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/admin/validate-session', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSession(data.session);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const response = await fetch('/api/auth/admin/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error || 'فشل في إرسال رمز التحقق',
        };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم',
      };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/admin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Session will be updated on next checkSession call
        await checkSession();
        
        return {
          success: true,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error || 'فشل في التحقق من الرمز',
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        error: 'حدث خطأ في الاتصال بالخادم',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    sendOTP,
    verifyOTP,
    logout,
    checkSession,
  };
}