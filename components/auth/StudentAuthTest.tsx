"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthContext } from '@/providers/auth-provider';

export function StudentAuthTest() {
  const [testEmail, setTestEmail] = useState('test@student.com');
  const [testName, setTestName] = useState('طالب تجريبي');
  const [testPassword, setTestPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginStudent, logout, user, isAuthenticated } = useAuthContext();

  const createTestStudent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-test-student',
          email: testEmail,
          name: testName,
          password: testPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        console.log('Test student created:', result.credentials);
      } else {
        toast.error(result.error || 'حدث خطأ في إنشاء الطالب التجريبي');
      }
    } catch (error) {
      console.error('Test student creation error:', error);
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    const result = await loginStudent({
      email: testEmail,
      password: testPassword,
    });

    if (result.success) {
      toast.success('تم تسجيل الدخول بنجاح!');
    } else {
      toast.error(result.error || 'فشل تسجيل الدخول');
    }
  };

  const testAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/test');
      const result = await response.json();

      if (response.ok) {
        toast.success(`نظام المصادقة يعمل - عدد الطلاب: ${result.studentsCount}`);
        console.log('Auth system status:', result);
      } else {
        toast.error(result.error || 'حدث خطأ في اختبار النظام');
      }
    } catch (error) {
      console.error('Auth test error:', error);
      toast.error('حدث خطأ في الاتصال');
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>اختبار نظام مصادقة الطلاب</CardTitle>
        <CardDescription>
          أدوات تطوير لاختبار نظام المصادقة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">مسجل الدخول</h3>
              <p className="text-sm text-green-600">
                الاسم: {user.name}<br />
                البريد: {user.email}<br />
                الدور: {user.role}
              </p>
            </div>
            <Button onClick={logout} variant="outline" className="w-full">
              تسجيل الخروج
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">البريد الإلكتروني</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@student.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-name">الاسم</Label>
              <Input
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="طالب تجريبي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-password">كلمة المرور</Label>
              <Input
                id="test-password"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createTestStudent}
                disabled={isLoading}
                className="flex-1"
              >
                إنشاء طالب تجريبي
              </Button>
              <Button
                onClick={testLogin}
                variant="outline"
                className="flex-1"
              >
                تسجيل الدخول
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={testAuthStatus}
          variant="secondary"
          className="w-full"
        >
          اختبار حالة النظام
        </Button>
      </CardContent>
    </Card>
  );
}