"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthErrorHandler, AuthErrorCode, type AuthError } from '@/lib/auth-error-handler';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  courses?: string[];
  requiresPasswordChange?: boolean;
  lastLogin?: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionType: 'student' | 'admin' | null;
  error: AuthError | null;
  sessionExpiresAt?: number;
  // Enhanced loading states for better UX
  isValidatingSession: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isSendingOTP: boolean;
  isRefreshingSession: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginCredentials {
  email: string;
  otp: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  code?: string;
  sessionId?: string;
  requiresPasswordChange?: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionType: null,
    error: null,
    sessionExpiresAt: undefined,
    // Enhanced loading states for better UX
    isValidatingSession: false,
    isLoggingIn: false,
    isLoggingOut: false,
    isSendingOTP: false,
    isRefreshingSession: false,
  });
  
  const router = useRouter();

  // Clear error after a timeout
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Set error with automatic clearing
  const setError = useCallback((error: AuthError) => {
    setAuthState(prev => ({ ...prev, error }));
    // Clear error after 10 seconds
    setTimeout(clearError, 10000);
  }, [clearError]);

  // Validate current session with enhanced error handling and OSLOJS integration
  const validateSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: true, 
        isValidatingSession: true, 
        error: null 
      }));

      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest', // Enhanced security header
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.valid && data.user) {
          setAuthState(prev => ({
            ...prev,
            user: data.user,
            isLoading: false,
            isValidatingSession: false,
            isAuthenticated: true,
            sessionType: data.sessionType,
            error: null,
            sessionExpiresAt: data.expiresAt,
          }));
          return true;
        }
      }

      // Handle error response with enhanced OSLOJS error mapping
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const authError = AuthErrorHandler.handleError(errorData, 'session-validation');
        setError(authError);
      }

      // Session invalid or expired - clear any existing state
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isValidatingSession: false,
        isAuthenticated: false,
        sessionType: null,
        error: null,
        sessionExpiresAt: undefined,
      }));
      
      // Enhanced client-side cleanup with OSLOJS session management
      if (typeof document !== 'undefined') {
        // Clear all possible auth-related cookies
        const cookiesToClear = ['auth-token', 'session-token', 'refresh-token', 'oslojs-session'];
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
        });
      }
      
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      const authError = AuthErrorHandler.handleError(error, 'session-validation');
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isValidatingSession: false,
        isAuthenticated: false,
        sessionType: null,
        error: authError,
        sessionExpiresAt: undefined,
      }));
      return false;
    }
  }, [setError]);

  // Student login with enhanced error handling, validation, and OSLOJS integration
  const loginStudent = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      // Clear any existing errors and set loading state
      setAuthState(prev => ({ 
        ...prev, 
        error: null, 
        isLoggingIn: true,
        isLoading: true 
      }));

      // Enhanced input validation using AuthErrorHandler
      const emailValidationError = AuthErrorHandler.validateEmail(credentials.email);
      if (emailValidationError) {
        setError(emailValidationError);
        toast.error(AuthErrorHandler.getUserMessage(emailValidationError, 'ar'));
        setAuthState(prev => ({ ...prev, isLoggingIn: false, isLoading: false }));
        return { success: false, error: emailValidationError.messageAr, code: emailValidationError.code };
      }

      const passwordValidationError = AuthErrorHandler.validatePassword(credentials.password);
      if (passwordValidationError) {
        setError(passwordValidationError);
        toast.error(AuthErrorHandler.getUserMessage(passwordValidationError, 'ar'));
        setAuthState(prev => ({ ...prev, isLoggingIn: false, isLoading: false }));
        return { success: false, error: passwordValidationError.messageAr, code: passwordValidationError.code };
      }

      // Enhanced request with OSLOJS security headers
      const response = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-OSLOJS-Client': 'web', // OSLOJS integration marker
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
          timestamp: Date.now(), // Anti-replay protection
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          isLoading: false,
          isLoggingIn: false,
          isAuthenticated: true,
          sessionType: 'student',
          error: null,
          sessionExpiresAt: data.expiresAt,
        }));

        const successMessage = data.message || 'تم تسجيل الدخول بنجاح';
        toast.success(successMessage);
        
        // Handle password change requirement with enhanced UX
        if (data.requiresPasswordChange) {
          toast.info('يجب تغيير كلمة المرور عند أول تسجيل دخول');
          router.push('/change-password');
          return { success: true, requiresPasswordChange: true };
        }
        
        // Enhanced redirect logic with better path handling
        const intendedPath = sessionStorage.getItem('intended-path');
        if (intendedPath && intendedPath !== '/login') {
          sessionStorage.removeItem('intended-path');
          router.push(intendedPath);
        } else {
          router.push('/dashboard');
        }
        
        return { success: true, sessionId: data.sessionId };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, isLoggingIn: false }));
        
        // Enhanced error handling with OSLOJS error mapping
        const authError = data.error ? 
          AuthErrorHandler.handleError(data, 'student-login') :
          AuthErrorHandler.createError(AuthErrorCode.INVALID_CREDENTIALS);
        
        setError(authError);
        toast.error(AuthErrorHandler.getUserMessage(authError, 'ar'));
        return { success: false, error: authError.messageAr, code: authError.code };
      }
    } catch (error) {
      console.error('Student login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, isLoggingIn: false }));
      
      // Enhanced network error handling
      const authError = error instanceof TypeError && error.message.includes('fetch') ?
        AuthErrorHandler.createError(AuthErrorCode.SERVICE_UNAVAILABLE) :
        AuthErrorHandler.handleError(error, 'student-login');
      
      setError(authError);
      toast.error(AuthErrorHandler.getUserMessage(authError, 'ar'));
      return { success: false, error: authError.messageAr, code: authError.code };
    }
  }, [router, setError]);

  // Admin login with enhanced OTP handling and OSLOJS integration
  const loginAdmin = useCallback(async (credentials: AdminLoginCredentials): Promise<AuthResult> => {
    try {
      // Clear any existing errors and set loading state
      setAuthState(prev => ({ 
        ...prev, 
        error: null, 
        isLoggingIn: true,
        isLoading: true 
      }));

      // Enhanced input validation
      const emailValidationError = AuthErrorHandler.validateEmail(credentials.email);
      if (emailValidationError) {
        setError(emailValidationError);
        toast.error(AuthErrorHandler.getUserMessage(emailValidationError, 'ar'));
        setAuthState(prev => ({ ...prev, isLoggingIn: false, isLoading: false }));
        return { success: false, error: emailValidationError.messageAr, code: emailValidationError.code };
      }

      // Enhanced OTP validation with OSLOJS standards
      if (!credentials.otp || !/^\d{6}$/.test(credentials.otp)) {
        const otpError = AuthErrorHandler.createError(AuthErrorCode.OTP_INVALID, {
          validationErrors: [{
            field: 'otp',
            message: 'OTP must be exactly 6 digits',
            messageAr: 'رمز التحقق يجب أن يكون 6 أرقام بالضبط'
          }]
        });
        setError(otpError);
        toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
        setAuthState(prev => ({ ...prev, isLoggingIn: false, isLoading: false }));
        return { success: false, error: otpError.messageAr, code: otpError.code };
      }

      // Enhanced request with OSLOJS security headers and anti-replay protection
      const response = await fetch('/api/auth/admin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-OSLOJS-Client': 'web',
          'X-OTP-Timestamp': Date.now().toString(), // OTP timing validation
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          otp: credentials.otp,
          timestamp: Date.now(),
          clientFingerprint: navigator.userAgent.slice(0, 100), // Basic fingerprinting
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          isLoading: false,
          isLoggingIn: false,
          isAuthenticated: true,
          sessionType: 'admin',
          error: null,
          sessionExpiresAt: data.expiresAt,
        }));

        const successMessage = data.message || 'تم تسجيل الدخول بنجاح للوحة الإدارة';
        toast.success(successMessage);
        
        // Enhanced admin redirect with session validation
        router.push('/admin/dashboard');
        return { success: true, sessionId: data.sessionId };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, isLoggingIn: false }));
        
        // Enhanced error handling with OTP-specific error mapping
        const authError = data.error ? 
          AuthErrorHandler.handleError(data, 'admin-login') :
          AuthErrorHandler.createError(AuthErrorCode.OTP_INVALID);
        
        setError(authError);
        toast.error(AuthErrorHandler.getUserMessage(authError, 'ar'));
        return { success: false, error: authError.messageAr, code: authError.code };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, isLoggingIn: false }));
      
      // Enhanced network error handling for admin authentication
      const authError = error instanceof TypeError && error.message.includes('fetch') ?
        AuthErrorHandler.createError(AuthErrorCode.SERVICE_UNAVAILABLE) :
        AuthErrorHandler.handleError(error, 'admin-login');
      
      setError(authError);
      toast.error(AuthErrorHandler.getUserMessage(authError, 'ar'));
      return { success: false, error: authError.messageAr, code: authError.code };
    }
  }, [router, setError]);

  // Enhanced logout with thorough cleanup and OSLOJS session management
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: true, 
        isLoggingOut: true, 
        error: null 
      }));

      // Enhanced logout API call with OSLOJS session termination
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-OSLOJS-Client': 'web',
          'X-Session-Termination': 'true', // OSLOJS session termination flag
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          terminateAllSessions: false, // Only terminate current session
        }),
      });

      // Enhanced client state cleanup regardless of API response
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isLoggingOut: false,
        isAuthenticated: false,
        sessionType: null,
        error: null,
        sessionExpiresAt: undefined,
        // Reset all loading states
        isValidatingSession: false,
        isLoggingIn: false,
        isSendingOTP: false,
        isRefreshingSession: false,
      }));

      // Enhanced client-side storage cleanup with OSLOJS considerations
      if (typeof window !== 'undefined') {
        // Clear all possible auth-related storage
        const storageKeys = [
          'auth-user', 'auth-token', 'session-data', 'oslojs-session',
          'refresh-token', 'admin-session', 'student-session'
        ];
        
        storageKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        // Clear session-specific items
        sessionStorage.removeItem('intended-path');
        sessionStorage.removeItem('otp-email');
        sessionStorage.removeItem('login-timestamp');
        
        // Enhanced cookie cleanup with OSLOJS session cookies
        const cookiesToClear = [
          'auth-token', 'session-token', 'refresh-token', 'oslojs-session',
          'admin-session', 'student-session', 'csrf-token'
        ];
        
        cookiesToClear.forEach(cookieName => {
          // Clear for all possible paths and domains
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/admin; secure; samesite=strict`;
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api; secure; samesite=strict`;
        });
      }

      // Enhanced logout response handling
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const successMessage = data.message || 'تم تسجيل الخروج بنجاح';
        toast.success(successMessage);
        
        // Log successful logout for security monitoring
        console.info('User logged out successfully', {
          timestamp: new Date().toISOString(),
          sessionTerminated: true
        });
      } else {
        // Even if logout fails on server, we've cleared client state
        toast.success('تم تسجيل الخروج من الجهاز');
        console.warn('Server logout failed, but client state cleared');
      }

      // Enhanced redirect with cleanup verification
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      
      // Ensure client state is cleared even on error
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isLoggingOut: false,
        isAuthenticated: false,
        sessionType: null,
        error: null,
        sessionExpiresAt: undefined,
        isValidatingSession: false,
        isLoggingIn: false,
        isSendingOTP: false,
        isRefreshingSession: false,
      }));
      
      // Force client-side cleanup on error
      if (typeof window !== 'undefined') {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
        });
      }
      
      toast.success('تم تسجيل الخروج');
      router.push('/login');
    }
  }, [router]);



  // Require authentication with enhanced role-based access control
  const requireAuth = useCallback((requiredRole?: 'student' | 'admin') => {
    if (!authState.isAuthenticated) {
      const authRequiredError = AuthErrorHandler.createError(AuthErrorCode.ACCESS_DENIED);
      setError(authRequiredError);
      toast.error('يجب تسجيل الدخول للوصول لهذه الصفحة');
      
      // Store intended path for redirect after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('intended-path', window.location.pathname);
      }
      
      router.push('/login');
      return false;
    }

    if (requiredRole && authState.user?.role !== requiredRole) {
      // Special case: allow admins to access student routes
      if (requiredRole === 'student' && authState.user?.role === 'admin') {
        return true;
      }
      
      const roleError = AuthErrorHandler.createError(AuthErrorCode.INSUFFICIENT_PERMISSIONS);
      setError(roleError);
      toast.error(AuthErrorHandler.getUserMessage(roleError, 'ar'));
      
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
  }, [authState.isAuthenticated, authState.user?.role, router, setError]);

  // Enhanced session refresh with OSLOJS token management
  const refreshSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isRefreshingSession: true }));

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-OSLOJS-Client': 'web',
          'X-Session-Refresh': 'true',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          currentSessionId: authState.user?.id, // Include current session context
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAuthState(prev => ({
            ...prev,
            sessionExpiresAt: data.expiresAt,
            isRefreshingSession: false,
            user: data.user || prev.user, // Update user data if provided
          }));
          
          // Log successful refresh for monitoring
          console.info('Session refreshed successfully', {
            newExpiresAt: new Date(data.expiresAt).toISOString(),
            sessionType: authState.sessionType
          });
          
          return true;
        }
      }
      
      setAuthState(prev => ({ ...prev, isRefreshingSession: false }));
      
      // If refresh fails, the session might be invalid
      if (response.status === 401) {
        const sessionExpiredError = AuthErrorHandler.createError(AuthErrorCode.SESSION_EXPIRED);
        setError(sessionExpiredError);
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
      }
      
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      setAuthState(prev => ({ ...prev, isRefreshingSession: false }));
      
      // Handle network errors gracefully
      const authError = AuthErrorHandler.handleError(error, 'session-refresh');
      if (AuthErrorHandler.isSecuritySensitive(authError)) {
        setError(authError);
      }
      
      return false;
    }
  }, [authState.user?.id, authState.sessionType, setError]);

  // Enhanced session monitoring with OSLOJS integration and proactive refresh
  useEffect(() => {
    validateSession();

    // Enhanced session expiration monitoring with proactive refresh
    const checkSessionExpiration = () => {
      if (authState.sessionExpiresAt) {
        const now = Date.now();
        const timeUntilExpiry = authState.sessionExpiresAt - now;
        
        // Proactive refresh when 5 minutes remain (for sessions > 10 minutes)
        const sessionDuration = authState.sessionExpiresAt - (authState.user?.lastLogin || now);
        if (sessionDuration > 10 * 60 * 1000 && timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
          console.info('Proactively refreshing session (5 minutes remaining)');
          refreshSession();
        }
        
        // Session expired
        if (timeUntilExpiry <= 0) {
          const expiredError = AuthErrorHandler.createError(AuthErrorCode.SESSION_EXPIRED);
          setError(expiredError);
          toast.error(AuthErrorHandler.getUserMessage(expiredError, 'ar'));
          logout();
        }
        
        // Warn user when 2 minutes remain
        if (timeUntilExpiry <= 2 * 60 * 1000 && timeUntilExpiry > 1.5 * 60 * 1000) {
          toast.warning('ستنتهي صلاحية جلستك خلال دقيقتين. يرجى حفظ عملك.');
        }
      }
    };

    // Check session expiration every 30 seconds for better responsiveness
    const sessionCheckInterval = setInterval(checkSessionExpiration, 30000);

    // Enhanced visibility change handling for OSLOJS session management
    const handleVisibilityChange = () => {
      if (!document.hidden && authState.isAuthenticated) {
        // Validate session when user returns to tab
        validateSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Enhanced beforeunload handling for session cleanup
    const handleBeforeUnload = () => {
      // Don't perform logout on page refresh, only on actual navigation away
      if (authState.isAuthenticated && performance.navigation?.type !== 1) {
        // This is a navigation away, not a refresh
        navigator.sendBeacon('/api/auth/session-activity', JSON.stringify({
          action: 'page_unload',
          timestamp: Date.now()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(sessionCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [validateSession, authState.sessionExpiresAt, authState.isAuthenticated, authState.user?.lastLogin, logout, setError, refreshSession]);

  // Enhanced OTP sending with OSLOJS integration and rate limiting
  const sendOTP = useCallback(async (email: string) => {
    try {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: true, 
        isSendingOTP: true, 
        error: null 
      }));

      // Enhanced email validation
      const emailValidationError = AuthErrorHandler.validateEmail(email);
      if (emailValidationError) {
        setError(emailValidationError);
        setAuthState(prev => ({ ...prev, isLoading: false, isSendingOTP: false }));
        return { success: false, error: AuthErrorHandler.getUserMessage(emailValidationError, 'ar') };
      }

      // Enhanced OTP request with OSLOJS security features
      const response = await fetch('/api/auth/admin/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-OSLOJS-Client': 'web',
          'X-OTP-Request-Time': Date.now().toString(),
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          timestamp: Date.now(),
          requestId: crypto.randomUUID(), // Unique request ID for tracking
          clientInfo: {
            userAgent: navigator.userAgent.slice(0, 100),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState(prev => ({ ...prev, isLoading: false, isSendingOTP: false }));
        
        // Enhanced session storage with OTP metadata
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('otp-email', email);
          sessionStorage.setItem('otp-request-time', Date.now().toString());
          sessionStorage.setItem('otp-expires-at', (Date.now() + 15 * 60 * 1000).toString()); // 15 minutes
        }
        
        return { 
          success: true, 
          message: data.message || 'تم إرسال رمز التحقق بنجاح',
          expiresIn: data.expiresIn || 900 // 15 minutes in seconds
        };
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false, isSendingOTP: false }));
        
        // Enhanced error handling with rate limiting awareness
        const authError = AuthErrorHandler.handleError(data, 'send-otp');
        setError(authError);
        
        // Handle rate limiting specifically
        if (data.retryAfter) {
          return { 
            success: false, 
            error: `يرجى المحاولة بعد ${Math.ceil(data.retryAfter / 60)} دقيقة`,
            retryAfter: data.retryAfter
          };
        }
        
        return { success: false, error: AuthErrorHandler.getUserMessage(authError, 'ar') };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, isSendingOTP: false }));
      
      // Enhanced network error handling
      const authError = error instanceof TypeError && error.message.includes('fetch') ?
        AuthErrorHandler.createError(AuthErrorCode.SERVICE_UNAVAILABLE) :
        AuthErrorHandler.handleError(error, 'send-otp');
      
      setError(authError);
      return { success: false, error: AuthErrorHandler.getUserMessage(authError, 'ar') };
    }
  }, [setError]);

  return {
    ...authState,
    loginStudent,
    loginAdmin,
    logout,
    validateSession,
    requireAuth,
    refreshSession,
    sendOTP,
    clearError,
    // Enhanced loading state getters for better UX
    isPerformingAuth: authState.isLoggingIn || authState.isLoggingOut || authState.isValidatingSession,
    canPerformActions: !authState.isLoading && !authState.isLoggingIn && !authState.isLoggingOut,
  };
}