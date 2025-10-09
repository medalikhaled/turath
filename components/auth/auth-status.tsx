"use client";

import { useAuthContext } from '@/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Clock, RefreshCw } from 'lucide-react';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function AuthStatus({ showDetails = false, className }: AuthStatusProps) {
  const { 
    user, 
    isLoading, 
    isAuthenticated, 
    sessionType, 
    validateSession,
    logout 
  } = useAuthContext();

  const handleRefresh = async () => {
    await validateSession();
  };

  if (!showDetails && !isAuthenticated) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {isAuthenticated ? (
            <>
              <User className="h-4 w-4 text-green-600" />
              حالة المصادقة
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 text-red-600" />
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
                <span className="text-sm font-mono">{user.email}</span>
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
                  <Badge variant="outline">{sessionType}</Badge>
                </div>
              )}

              {user.role === 'student' && user.courses && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">عدد الدورات:</span>
                  <Badge variant="outline">{user.courses.length}</Badge>
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
                className="flex-1"
              >
                تسجيل الخروج
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
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