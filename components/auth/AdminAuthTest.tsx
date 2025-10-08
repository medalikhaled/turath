'use client';

import { useState } from 'react';
import { useAdminAuth } from '../../hooks/use-admin-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

export function AdminAuthTest() {
  const { user, session, isLoading, isAuthenticated, sendOTP, verifyOTP, logout } = useAdminAuth();
  const [email, setEmail] = useState('admin@hanbaliacademy.com');
  const [otp, setOTP] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMessage('');

    const result = await sendOTP(email);
    
    if (result.success) {
      setMessage(result.message || 'تم إرسال رمز التحقق');
      setOtpSent(true);
    } else {
      setError(result.error || 'فشل في إرسال رمز التحقق');
    }

    setIsProcessing(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('يرجى إدخال رمز التحقق');
      return;
    }

    setIsProcessing(true);
    setError('');
    setMessage('');

    const result = await verifyOTP(email, otp);
    
    if (result.success) {
      setMessage(result.message || 'تم تسجيل الدخول بنجاح');
      setOtpSent(false);
      setOTP('');
    } else {
      setError(result.error || 'فشل في التحقق من الرمز');
    }

    setIsProcessing(false);
  };

  const handleLogout = async () => {
    setIsProcessing(true);
    await logout();
    setMessage('تم تسجيل الخروج بنجاح');
    setError('');
    setOtpSent(false);
    setOTP('');
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">جاري التحقق من الجلسة...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>اختبار نظام المصادقة للمدراء</CardTitle>
          <CardDescription>
            اختبار نظام OTP للمدراء مع إدارة الجلسات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">الحالة الحالية:</h3>
            <p>مصادق: {isAuthenticated ? 'نعم' : 'لا'}</p>
            {user && (
              <div className="mt-2 space-y-1">
                <p>البريد الإلكتروني: {user.email}</p>
                <p>الدور: {user.role}</p>
                <p>معرف الجلسة: {user.sessionId}</p>
              </div>
            )}
            {session && (
              <div className="mt-2 space-y-1">
                <p>تنتهي الجلسة في: {new Date(session.expiresAt).toLocaleString('ar-SA')}</p>
                <p>آخر وصول: {new Date(session.lastAccessAt).toLocaleString('ar-SA')}</p>
              </div>
            )}
          </div>

          <Separator />

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

          {!isAuthenticated ? (
            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني للمدير</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hanbaliacademy.com"
                  disabled={isProcessing || otpSent}
                />
              </div>

              {!otpSent ? (
                <Button 
                  onClick={handleSendOTP} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </Button>
              ) : (
                <div className="space-y-4">
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
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleVerifyOTP} 
                      disabled={isProcessing || otp.length !== 6}
                      className="flex-1"
                    >
                      {isProcessing ? 'جاري التحقق...' : 'تحقق من الرمز'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setOtpSent(false);
                        setOTP('');
                        setError('');
                        setMessage('');
                      }}
                      disabled={isProcessing}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">تم تسجيل الدخول بنجاح!</h3>
                <p className="text-green-700">يمكنك الآن الوصول إلى لوحة الإدارة.</p>
              </div>
              
              <Button 
                onClick={handleLogout} 
                disabled={isProcessing}
                variant="destructive"
                className="w-full"
              >
                {isProcessing ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات التطوير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>البريد الإلكتروني المصرح:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>admin@hanbaliacademy.com</li>
              <li>superadmin@hanbaliacademy.com</li>
              <li>director@hanbaliacademy.com</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              في بيئة التطوير، سيتم عرض رمز OTP في وحدة التحكم (Console) بدلاً من إرساله عبر البريد الإلكتروني.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}