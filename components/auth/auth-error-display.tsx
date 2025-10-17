"use client";

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, RefreshCw, Shield, Clock } from 'lucide-react';
import { AuthError, AuthErrorCode } from '@/lib/auth-error-handler';

interface AuthErrorDisplayProps {
  error: AuthError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  // Enhanced props for better UX
  showDetails?: boolean;
  compact?: boolean;
  position?: 'top' | 'bottom' | 'inline';
  theme?: 'light' | 'dark';
}

export function AuthErrorDisplay({
  error,
  onDismiss,
  onRetry,
  className = '',
  showRetryButton = false,
  autoHide = true,
  autoHideDelay = 8000,
  showDetails = true,
  compact = false,
  position = 'inline',
  theme = 'dark'
}: AuthErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  if (!error || !isVisible) {
    return null;
  }

  const getErrorIcon = () => {
    switch (error.code) {
      case AuthErrorCode.SESSION_EXPIRED:
      case AuthErrorCode.OTP_EXPIRED:
        return <Clock className="h-4 w-4" />;
      case AuthErrorCode.RATE_LIMITED:
      case AuthErrorCode.TOO_MANY_ATTEMPTS:
      case AuthErrorCode.ACCOUNT_LOCKED:
        return <Shield className="h-4 w-4" />;
      case AuthErrorCode.INVALID_CREDENTIALS:
      case AuthErrorCode.OTP_INVALID:
        return <AlertTriangle className="h-4 w-4" />;
      case AuthErrorCode.STUDENT_INACTIVE:
      case AuthErrorCode.ACCOUNT_INACTIVE:
        return <X className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = () => {
    switch (error.code) {
      case AuthErrorCode.RATE_LIMITED:
      case AuthErrorCode.TOO_MANY_ATTEMPTS:
      case AuthErrorCode.ACCOUNT_LOCKED:
        return 'destructive';
      case AuthErrorCode.SESSION_EXPIRED:
      case AuthErrorCode.OTP_EXPIRED:
        return 'default';
      default:
        return 'destructive';
    }
  };

  const shouldShowRetry = () => {
    const retryableCodes = [
      AuthErrorCode.INTERNAL_ERROR,
      AuthErrorCode.SERVICE_UNAVAILABLE,
      AuthErrorCode.DATABASE_ERROR,
      AuthErrorCode.EXTERNAL_SERVICE_ERROR,
      AuthErrorCode.OTP_GENERATION_FAILED
    ];
    
    return showRetryButton && retryableCodes.includes(error.code as AuthErrorCode);
  };

  const getRetryAfterText = () => {
    if (error.details?.retryAfter) {
      const seconds = error.details.retryAfter;
      if (seconds < 60) {
        return `يرجى المحاولة بعد ${seconds} ثانية`;
      } else if (seconds < 3600) {
        const minutes = Math.ceil(seconds / 60);
        return `يرجى المحاولة بعد ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
      } else {
        const hours = Math.ceil(seconds / 3600);
        return `يرجى المحاولة بعد ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
      }
    }
    return null;
  };

  const getRemainingAttemptsText = () => {
    if (error.details?.remainingAttempts !== undefined) {
      const remaining = error.details.remainingAttempts;
      if (remaining > 0) {
        return `المحاولات المتبقية: ${remaining}`;
      } else {
        return 'لا توجد محاولات متبقية';
      }
    }
    return null;
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4';
      case 'bottom':
        return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4';
      default:
        return '';
    }
  };

  const getThemeClasses = () => {
    if (theme === 'light') {
      return 'bg-white border-gray-200 text-gray-900';
    }
    return 'bg-gray-900/95 backdrop-blur-sm border-gray-700 text-white';
  };

  return (
    <Alert 
      variant={getErrorVariant()} 
      className={`animate-in slide-in-from-top-2 duration-300 ${getPositionClasses()} ${getThemeClasses()} ${compact ? 'py-2' : ''} ${className}`}
      dir="rtl"
    >
      <div className={`flex items-start gap-3 ${compact ? 'gap-2' : ''}`}>
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 space-y-2">
          <AlertDescription className={`font-arabic ${compact ? 'text-xs' : 'text-sm'}`}>
            {error.messageAr}
          </AlertDescription>
          
          {/* Enhanced error details with better formatting */}
          {showDetails && (
            <>
              {getRetryAfterText() && (
                <div className={`text-xs opacity-80 font-arabic bg-amber-500/10 rounded px-2 py-1 border border-amber-500/20`}>
                  <Clock className="h-3 w-3 inline ml-1" />
                  {getRetryAfterText()}
                </div>
              )}
              
              {getRemainingAttemptsText() && (
                <div className={`text-xs opacity-80 font-arabic bg-red-500/10 rounded px-2 py-1 border border-red-500/20`}>
                  <Shield className="h-3 w-3 inline ml-1" />
                  {getRemainingAttemptsText()}
                </div>
              )}
              
              {/* Enhanced validation errors with better formatting */}
              {error.details?.validationErrors && (
                <div className="space-y-2 bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                  <div className="text-xs font-medium font-arabic text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    أخطاء التحقق:
                  </div>
                  <div className="space-y-1">
                    {error.details.validationErrors.map((validationError: any, index: number) => (
                      <div key={index} className="text-xs font-arabic flex items-start gap-2 bg-red-500/5 rounded p-2">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                        <div className="flex-1">
                          <span className="text-red-300">
                            {validationError.messageAr || validationError.message}
                          </span>
                          {validationError.field && (
                            <div className="text-xs text-red-400/70 mt-1">
                              الحقل: {validationError.field}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced security tips for specific errors */}
              {(error.code === AuthErrorCode.WEAK_PASSWORD || error.code === AuthErrorCode.INVALID_CREDENTIALS) && (
                <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                  <div className="text-xs font-arabic text-blue-300 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    نصائح الأمان:
                  </div>
                  <ul className="text-xs text-blue-200/80 mt-1 space-y-1 font-arabic">
                    <li>• استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</li>
                    <li>• تأكد من صحة البريد الإلكتروني</li>
                    <li>• لا تشارك بيانات الدخول مع أحد</li>
                  </ul>
                </div>
              )}
            </>
          )}
          
          {/* Enhanced action buttons */}
          {!compact && (shouldShowRetry() || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {shouldShowRetry() && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-8 px-3 text-xs font-arabic hover:bg-blue-500/10 border-blue-500/30"
                >
                  <RefreshCw className="h-3 w-3 ml-1" />
                  إعادة المحاولة
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="h-8 px-3 text-xs font-arabic hover:bg-gray-500/10"
                >
                  <X className="h-3 w-3 ml-1" />
                  إغلاق
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced dismiss button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-500/10 rounded-full"
            title="إغلاق"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

// Specialized error displays for common scenarios
export function SessionExpiredError({ onLogin }: { onLogin: () => void }) {
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50" dir="rtl">
      <Clock className="h-4 w-4" />
      <AlertDescription className="font-arabic">
        انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى للمتابعة.
        <Button
          variant="link"
          onClick={onLogin}
          className="p-0 h-auto font-arabic text-amber-700 underline mr-2"
        >
          تسجيل الدخول
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function RateLimitError({ retryAfter }: { retryAfter?: number }) {
  const [timeLeft, setTimeLeft] = useState(retryAfter || 0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} ثانية`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} دقيقة`;
    }
  };

  return (
    <Alert variant="destructive" dir="rtl">
      <Shield className="h-4 w-4" />
      <AlertDescription className="font-arabic">
        تم تجاوز الحد المسموح من المحاولات. 
        {timeLeft > 0 && (
          <span className="block mt-1 text-sm">
            يرجى المحاولة بعد: {formatTime(timeLeft)}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ValidationError({ errors }: { errors: Array<{ field: string; messageAr: string }> }) {
  return (
    <Alert variant="destructive" dir="rtl">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-arabic">
        <div className="space-y-1">
          <div className="font-medium">يرجى تصحيح الأخطاء التالية:</div>
          {errors.map((error, index) => (
            <div key={index} className="text-sm">
              • {error.messageAr}
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}