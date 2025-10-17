"use client";

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { AuthErrorDisplay } from '@/components/auth/auth-error-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Clock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
  showErrors?: boolean;
}

export function AuthStatus({ 
  showDetails = false, 
  className,
  showErrors = true 
}: AuthStatusProps) {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    sessionType, 
    sessionExpiresAt,
    validateSession,
    logout,
    error,
    clearError
  } = useAuthContext();
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string>('');

  const handleRefresh = async () => {
    await validateSession();
    setLastUpdate(new Date());
  };

  // Update session expiry countdown
  useEffect(() => {
    if (sessionExpiresAt) {
      const updateCountdown = () => {
        const now = Date.now();
        const timeLeft = sessionExpiresAt - now;
        
        if (timeLeft <= 0) {
          setTimeUntilExpiry('منتهية الصلاحية');
        } else {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0) {
            setTimeUntilExpiry(`${hours}س ${minutes}د`);
          } else {
            setTimeUntilExpiry(`${minutes}د`);
          }
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [sessionExpiresAt]);

  if (!showDetails && !isAuthenticated) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Error Display */}
      {showErrors && error && (
        <AuthErrorDisplay
          error={error}
          onDismiss={clearError}
          showRetryButton={true}
          onRetry={handleRefresh}
          autoHide={true}
          autoHideDelay={10000}
        />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {isAuthenticated ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                حالة المصادقة
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                غير مصادق
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isLoading ? 'جاري التحقق...' : isAuthenticated ? 'تم تسجيل الدخول بنجاح' : 'لم يتم تسجيل الدخول'}
          </CardDescription>
        </CardHeader>
        
        {showDetails && (
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isLoading ? 'جاري التحميل' : isAuthenticated ? 'مصادق' : 'غير مصادق'}
              </Badge>
            </div>

            {isAuthenticated && user && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الاسم:</span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">البريد الإلكتروني:</span>
                  <span className="text-sm font-mono text-left" dir="ltr">{user.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الدور:</span>
                  <Badge variant={user.role === 'admin' ? 'secondary' : 'outline'}>
                    {user.role === 'admin' ? 'مدير' : 'طالب'}
                  </Badge>
                </div>

                {sessionType && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نوع الجلسة:</span>
                    <Badge variant="outline">{sessionType === 'admin' ? 'إدارية' : 'طالب'}</Badge>
                  </div>
                )}

                {sessionExpiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">انتهاء الجلسة:</span>
                    <Badge 
                      variant={timeUntilExpiry === 'منتهية الصلاحية' ? 'destructive' : 'outline'}
                      className="font-mono"
                    >
                      {timeUntilExpiry}
                    </Badge>
                  </div>
                )}

                {user.role === 'student' && user.courses && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">عدد الدورات:</span>
                    <Badge variant="outline">{user.courses.length}</Badge>
                  </div>
                )}

                {user.requiresPasswordChange && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">حالة كلمة المرور:</span>
                    <Badge variant="destructive">تحتاج تغيير</Badge>
                  </div>
                )}

                {user.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">آخر دخول:</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleString('ar-SA')}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className={`h-3 w-3 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>

              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  disabled={isLoading}
                  className="flex-1"
                >
                  تسجيل الخروج
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Convenience component for debugging
export function AuthDebugPanel() {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <AuthStatus showDetails={true} />
    </div>
  );
}