"use client";

import { useState } from 'react';
import { useAuthContext } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { AuthErrorDisplay } from '@/components/auth/auth-error-display';
import { LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  className?: string;
  confirmLogout?: boolean;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  showIcon = true,
  className,
  confirmLogout = false,
  onLogoutStart,
  onLogoutComplete
}: LogoutButtonProps) {
  const { logout, isLoading, error, clearError } = useAuthContext();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    if (confirmLogout && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    try {
      onLogoutStart?.();
      clearError(); // Clear any existing errors
      await logout();
      onLogoutComplete?.();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600 text-sm font-arabic">
          <AlertTriangle className="h-4 w-4" />
          <span>هل أنت متأكد من تسجيل الخروج؟</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex-1 font-arabic"
          >
            إلغاء
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 font-arabic"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin ml-1" />
                جاري الخروج...
              </>
            ) : (
              <>
                <LogOut className="h-3 w-3 ml-1" />
                تأكيد الخروج
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <AuthErrorDisplay
          error={error}
          onDismiss={clearError}
          showRetryButton={false}
          autoHide={true}
          autoHideDelay={5000}
        />
      )}
      
      <Button
        variant={variant}
        size={size}
        onClick={handleLogout}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin ml-2" />
        ) : (
          showIcon && <LogOut className="h-4 w-4 ml-2" />
        )}
        {isLoading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
      </Button>
    </div>
  );
}