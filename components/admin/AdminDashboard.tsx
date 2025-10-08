'use client';

import { useAdminAuth } from '../../hooks/use-admin-auth';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function AdminDashboard() {
  const { user, session, isLoading, isAuthenticated, logout } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">غير مصرح بالوصول</h2>
            <p className="text-muted-foreground mb-4">
              يجب تسجيل الدخول كمدير للوصول إلى هذه الصفحة
            </p>
            <Button onClick={() => window.location.href = '/dev/admin-auth-test'}>
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
            <p className="text-muted-foreground">أكاديمية تراث الحنابلة</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-muted-foreground">مدير</p>
            </div>
            <Button variant="outline" onClick={logout}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Session Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات الجلسة</CardTitle>
              <CardDescription>تفاصيل الجلسة الحالية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">البريد الإلكتروني:</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">معرف الجلسة:</p>
                <p className="text-sm text-muted-foreground font-mono">{user?.sessionId}</p>
              </div>
              {session && (
                <>
                  <div>
                    <p className="text-sm font-medium">تنتهي في:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.expiresAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">آخر وصول:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.lastAccessAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات السريعة</CardTitle>
              <CardDescription>إجراءات الإدارة الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                إدارة الطلاب
              </Button>
              <Button className="w-full" variant="outline">
                إدارة الدورات
              </Button>
              <Button className="w-full" variant="outline">
                إدارة الجلسات
              </Button>
              <Button className="w-full" variant="outline">
                إدارة الأخبار
              </Button>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>حالة النظام</CardTitle>
              <CardDescription>معلومات النظام الحالية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">حالة المصادقة:</span>
                <span className="text-sm text-green-600">✓ نشط</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">نوع الجلسة:</span>
                <span className="text-sm">مدير</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">مدة الجلسة:</span>
                <span className="text-sm">24 ساعة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">الأمان:</span>
                <span className="text-sm text-green-600">✓ OTP</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">مرحباً بك في لوحة الإدارة</h2>
              <p className="text-muted-foreground">
                تم تسجيل دخولك بنجاح باستخدام نظام OTP الآمن. يمكنك الآن إدارة جميع جوانب أكاديمية تراث الحنابلة.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}