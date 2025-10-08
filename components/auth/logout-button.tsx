"use client";

import { useAuthContext } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function LogoutButton({ 
  variant = 'ghost', 
  size = 'default',
  showIcon = true,
  className 
}: LogoutButtonProps) {
  const { logout, isLoading } = useAuthContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
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
  );
}