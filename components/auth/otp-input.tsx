"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface OTPInputProps {
  email: string;
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string; expiresIn?: number; retryAfter?: number }>;
  onBack: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  // Enhanced props for better UX
  maxAttempts?: number;
  currentAttempts?: number;
  isResending?: boolean;
  autoSubmit?: boolean;
  showTimer?: boolean;
}

export function OTPInput({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading = false,
  title = "تحقق من الهوية",
  description = "أدخل رمز التحقق المرسل إلى بريدك الإلكتروني",
  maxAttempts = 5,
  currentAttempts = 0,
  isResending = false,
  autoSubmit = true,
  showTimer = true
}: OTPInputProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(currentAttempts);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Clear any validation errors
    setValidationError('');
    
    // Enhanced input sanitization - allow digits and Arabic-Indic numerals
    let sanitizedValue = value;
    
    // Convert Arabic-Indic numerals to Western numerals
    const arabicToWestern = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    
    // Replace Arabic numerals with Western numerals
    for (const [arabic, western] of Object.entries(arabicToWestern)) {
      sanitizedValue = sanitizedValue.replace(new RegExp(arabic, 'g'), western);
    }
    
    // Only allow digits
    const digit = sanitizedValue.replace(/[^\d]/g, '');
    
    if (digit.length <= 1) {
      const newOtp = otp.split('');
      newOtp[index] = digit;
      const updatedOtp = newOtp.join('');
      setOtp(updatedOtp);

      // Enhanced auto-focus with better UX
      if (digit && index < 5) {
        // Add slight delay for better UX
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 50);
      }

      // Auto-submit when all 6 digits are entered (if enabled)
      if (updatedOtp.length === 6 && !isLoading && !isVerifying && autoSubmit) {
        // Add slight delay to ensure UI updates
        setTimeout(() => {
          handleVerify(updatedOtp);
        }, 100);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    let pastedData = e.clipboardData.getData('text');
    
    // Enhanced paste handling with Arabic numeral support
    const arabicToWestern = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    
    // Convert Arabic numerals to Western numerals
    for (const [arabic, western] of Object.entries(arabicToWestern)) {
      pastedData = pastedData.replace(new RegExp(arabic, 'g'), western);
    }
    
    // Extract only digits and limit to 6
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    
    // Clear validation errors
    setValidationError('');
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(digits.length, 5);
    setTimeout(() => {
      inputRefs.current[nextIndex]?.focus();
    }, 50);

    // Auto-submit if 6 digits pasted
    if (digits.length === 6 && !isLoading && !isVerifying && autoSubmit) {
      setTimeout(() => {
        handleVerify(digits);
      }, 100);
    }
    
    // Show success message for paste
    if (digits.length > 0) {
      toast.success(`تم لصق ${digits.length} أرقام`);
    }
  };

  const handleVerify = async (otpCode: string = otp) => {
    // Enhanced validation
    if (otpCode.length !== 6) {
      setValidationError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setValidationError('رمز التحقق يجب أن يحتوي على أرقام فقط');
      toast.error('رمز التحقق يجب أن يحتوي على أرقام فقط');
      return;
    }

    if (attempts >= maxAttempts) {
      setValidationError('تم تجاوز الحد الأقصى للمحاولات');
      toast.error('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد');
      return;
    }

    setIsVerifying(true);
    setValidationError('');

    try {
      const result = await onVerify(otpCode);
      
      if (!result.success) {
        setAttempts(prev => prev + 1);
        const remainingAttempts = maxAttempts - attempts - 1;
        
        if (remainingAttempts > 0) {
          setValidationError(`رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`);
          toast.error(`رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`);
        } else {
          setValidationError('تم استنفاد جميع المحاولات. يرجى طلب رمز جديد');
          toast.error('تم استنفاد جميع المحاولات. يرجى طلب رمز جديد');
        }
        
        // Clear OTP on error
        setOtp('');
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setValidationError('');
    
    try {
      const result = await onResend();
      
      if (result.success) {
        // Reset state for new OTP
        const newExpiryTime = result.expiresIn ? result.expiresIn : 900;
        setTimeLeft(newExpiryTime);
        setCanResend(false);
        setResendCooldown(result.retryAfter ? Math.ceil(result.retryAfter / 1000) : 60);
        setOtp('');
        setAttempts(0); // Reset attempts for new OTP
        inputRefs.current[0]?.focus();
        
        toast.success('تم إرسال رمز تحقق جديد بنجاح');
      } else {
        if (result.retryAfter) {
          const waitMinutes = Math.ceil(result.retryAfter / 60);
          setValidationError(`يرجى الانتظار ${waitMinutes} دقيقة قبل طلب رمز جديد`);
          toast.error(`يرجى الانتظار ${waitMinutes} دقيقة قبل طلب رمز جديد`);
        } else {
          setValidationError(result.error || 'فشل في إرسال رمز التحقق');
          toast.error(result.error || 'فشل في إرسال رمز التحقق');
        }
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setValidationError('حدث خطأ في إرسال رمز التحقق');
      toast.error('حدث خطأ في إرسال رمز التحقق');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white font-arabic">
          {title}
        </CardTitle>
        <CardDescription className="text-blue-100 font-arabic">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Email display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-white/80 font-arabic text-sm mb-2">
            <Mail className="h-4 w-4" />
            <span>تم إرسال الرمز إلى:</span>
          </div>
          <div className="text-white font-medium font-mono text-sm bg-white/10 rounded-lg px-3 py-2">
            {email}
          </div>
        </div>

        {/* OTP Input */}
        <div className="space-y-4">
          <Label className="text-white font-arabic text-center block">
            رمز التحقق (6 أرقام)
          </Label>
          
          <div className="flex gap-2 justify-center" dir="ltr">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-12 text-center text-lg font-bold bg-white/10 border-white/20 text-white placeholder:text-white/40 transition-all duration-200 ${
                  otp[index] ? 'border-blue-400 bg-blue-500/10' : ''
                } ${
                  validationError ? 'border-red-400 bg-red-500/10' : ''
                } hover:border-white/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20`}
                disabled={isLoading || isVerifying}
                autoComplete="one-time-code"
                placeholder="•"
                title={`رقم ${index + 1} من رمز التحقق`}
              />
            ))}
          </div>
        </div>

        {/* Enhanced validation and status display */}
        <div className="text-center space-y-2">
          {validationError && (
            <div className="text-red-300 text-sm font-arabic bg-red-900/20 rounded-lg px-3 py-2 border border-red-500/30">
              {validationError}
            </div>
          )}
          
          {showTimer && (
            <>
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>الرمز صالح لمدة: {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="text-red-300 text-sm font-arabic">
                  انتهت صلاحية الرمز. يرجى طلب رمز جديد
                </div>
              )}
            </>
          )}
          
          {/* Attempts counter */}
          {maxAttempts > 0 && (
            <div className="text-xs text-blue-300/80 font-arabic">
              المحاولات المتبقية: {Math.max(0, maxAttempts - attempts)} من {maxAttempts}
            </div>
          )}
        </div>

        {/* Enhanced action buttons with loading states */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={isLoading || isVerifying || isResending}
          >
            رجوع
          </Button>
          
          <Button
            type="button"
            onClick={() => handleVerify()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-arabic disabled:opacity-50"
            disabled={isLoading || isVerifying || otp.length !== 6 || attempts >= maxAttempts}
          >
            {isVerifying ? (
              <>
                <Clock className="h-4 w-4 ml-2 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              'تحقق'
            )}
          </Button>
        </div>

        {/* Enhanced resend button with better states */}
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            className="text-blue-300 hover:text-blue-200 font-arabic disabled:opacity-50"
            disabled={isLoading || isVerifying || isResending || resendCooldown > 0 || (!canResend && timeLeft > 0)}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? (
              'جاري الإرسال...'
            ) : resendCooldown > 0 ? (
              `إعادة الإرسال بعد ${resendCooldown}ث`
            ) : timeLeft <= 0 || canResend ? (
              'إعادة إرسال الرمز'
            ) : (
              'إعادة إرسال الرمز'
            )}
          </Button>
        </div>

        {/* Help text */}
        <div className="text-center text-xs text-white/60 font-arabic">
          <p>لم تستلم الرمز؟ تحقق من مجلد الرسائل غير المرغوب فيها</p>
        </div>
      </CardContent>
    </Card>
  );
}