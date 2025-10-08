'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { ADMIN_EMAILS, formatOTP, formatTimeRemaining, canRequestOTP } from '../../../lib/admin-utils';

interface OTPStats {
  total: number;
  active: number;
  expired: number;
  used: number;
  recentRequests: number;
  canRequestNew: boolean;
}

export default function OTPSystemTestPage() {
  const [selectedEmail, setSelectedEmail] = useState(ADMIN_EMAILS[0]);
  const [otp, setOTP] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpStats, setOTPStats] = useState<OTPStats | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  // Fetch OTP stats for selected email
  const fetchOTPStats = async () => {
    try {
      const response = await fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'otp:getOTPStats',
          args: { email: selectedEmail },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOTPStats(data);
      }
    } catch (error) {
      console.error('Error fetching OTP stats:', error);
    }
  };

  // Check admin session
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/admin/validate-session');
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setSessionInfo(null);
    }
  };

  useEffect(() => {
    fetchOTPStats();
    checkSession();
  }, [selectedEmail]);

  const handleSendOTP = async () => {
    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        await fetchOTPStats();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال بالخادم');
    }

    setIsProcessing(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: selectedEmail, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setOTP('');
        await fetchOTPStats();
        await checkSession();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('حدث خطأ في الاتصال بالخادم');
    }

    setIsProcessing(false);
  };

  const handleLogout = async () => {
    setIsProcessing(true);

    try {
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setMessage('تم تسجيل الخروج بنجاح');
      setSessionInfo(null);
      await fetchOTPStats();
    } catch (error) {
      setError('حدث خطأ أثناء تسجيل الخروج');
    }

    setIsProcessing(false);
  };

  const handleCleanup = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mutation: 'otp:cleanupExpiredData',
          args: {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`تم تنظيف ${data.cleanedOTPs} رمز OTP و ${data.cleanedSessions} جلسة منتهية الصلاحية`);
        await fetchOTPStats();
      }
    } catch (error) {
      setError('حدث خطأ أثناء التنظيف');
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">اختبار نظام OTP الشامل</h1>
          <p className="text-muted-foreground">
            اختبار جميع وظائف نظام المصادقة بـ OTP للمدراء
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Main Test Interface */}
          <Card>
            <CardHeader>
              <CardTitle>واجهة الاختبار</CardTitle>
              <CardDescription>إرسال والتحقق من رموز OTP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email Selection */}
              <div className="space-y-2">
                <Label>اختر البريد الإلكتروني للمدير</Label>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                  disabled={isProcessing}
                >
                  {ADMIN_EMAILS.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              {message && (
                <div className="p-3 bg-green-100 border border-green-300 rounded-md text-green-800">
                  {message}
                </div>
              )}
              
              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
                  {error}
                </div>
              )}

              {/* OTP Actions */}
              <div className="space-y-4">
                <Button 
                  onClick={handleSendOTP} 
                  disabled={isProcessing || (otpStats ? !otpStats.canRequestNew : false)}
                  className="w-full"
                >
                  {isProcessing ? 'جاري الإرسال...' : 'إرسال رمز OTP'}
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="otp">رمز التحقق (6 أرقام)</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    disabled={isProcessing}
                    maxLength={6}
                  />
                </div>

                <Button 
                  onClick={handleVerifyOTP} 
                  disabled={isProcessing || otp.length !== 6}
                  className="w-full"
                  variant="secondary"
                >
                  {isProcessing ? 'جاري التحقق...' : 'تحقق من الرمز'}
                </Button>
              </div>

              <Separator />

              {/* Session Actions */}
              <div className="space-y-2">
                <Button 
                  onClick={handleLogout} 
                  disabled={isProcessing || !sessionInfo}
                  variant="destructive"
                  className="w-full"
                >
                  {isProcessing ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
                </Button>

                <Button 
                  onClick={handleCleanup} 
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  {isProcessing ? 'جاري التنظيف...' : 'تنظيف البيانات المنتهية الصلاحية'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics and Info */}
          <div className="space-y-6">
            {/* OTP Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات OTP</CardTitle>
                <CardDescription>للبريد الإلكتروني: {selectedEmail}</CardDescription>
              </CardHeader>
              <CardContent>
                {otpStats ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>إجمالي الرموز:</span>
                      <span>{otpStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الرموز النشطة:</span>
                      <span className="text-green-600">{otpStats.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الرموز المنتهية الصلاحية:</span>
                      <span className="text-red-600">{otpStats.expired}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الرموز المستخدمة:</span>
                      <span className="text-blue-600">{otpStats.used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الطلبات الأخيرة (ساعة واحدة):</span>
                      <span>{otpStats.recentRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>يمكن طلب رمز جديد:</span>
                      <span className={otpStats.canRequestNew ? 'text-green-600' : 'text-red-600'}>
                        {otpStats.canRequestNew ? 'نعم' : 'لا'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
                )}
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الجلسة</CardTitle>
                <CardDescription>الجلسة الحالية للمدير</CardDescription>
              </CardHeader>
              <CardContent>
                {sessionInfo ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>البريد الإلكتروني:</span>
                      <span>{sessionInfo.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الدور:</span>
                      <span>{sessionInfo.user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>معرف الجلسة:</span>
                      <span className="font-mono text-xs">{sessionInfo.user.sessionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تنتهي في:</span>
                      <span>{new Date(sessionInfo.session.expiresAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>آخر وصول:</span>
                      <span>{new Date(sessionInfo.session.lastAccessAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center">
                      <span className="text-green-800 font-medium">✓ جلسة نشطة</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded text-center">
                    <span className="text-gray-600">لا توجد جلسة نشطة</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Development Notes */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات التطوير</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>في بيئة التطوير:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>رموز OTP تظهر في وحدة التحكم (Console)</li>
                  <li>لا يتم إرسال رسائل بريد إلكتروني فعلية</li>
                  <li>الحد الأقصى: 3 طلبات OTP في الساعة</li>
                  <li>صلاحية OTP: 15 دقيقة</li>
                  <li>مدة الجلسة: 24 ساعة</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}