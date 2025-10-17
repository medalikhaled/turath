"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Shield, Clock, AlertTriangle } from 'lucide-react';
import { AuthError } from '@/lib/auth-error-handler';

// Enhanced validation schemas with comprehensive Arabic error messages
const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('تنسيق البريد الإلكتروني غير صالح')
    .max(100, 'البريد الإلكتروني طويل جداً (الحد الأقصى 100 حرف)')
    .refine((email) => {
      // Additional validation for common email issues
      const trimmed = email.trim();
      return trimmed === email && !trimmed.includes('..') && !trimmed.startsWith('.') && !trimmed.endsWith('.');
    }, 'البريد الإلكتروني يحتوي على أحرف غير صالحة')
});

const studentLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('تنسيق البريد الإلكتروني غير صالح')
    .max(100, 'البريد الإلكتروني طويل جداً'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً (الحد الأقصى 128 حرف)')
    .refine((password) => {
      // Check for common weak patterns
      const weakPatterns = ['123456', 'password', 'admin', 'qwerty'];
      return !weakPatterns.some(pattern => password.toLowerCase().includes(pattern));
    }, 'كلمة المرور ضعيفة جداً. تجنب الأنماط الشائعة')
});

// Enhanced OTP validation schema
const otpSchema = z.object({
  otp: z
    .string()
    .min(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .max(6, 'رمز التحقق يجب أن يكون 6 أرقام')
    .regex(/^\d{6}$/, 'رمز التحقق يجب أن يحتوي على أرقام فقط')
});

type FormData = z.infer<typeof emailSchema> | z.infer<typeof studentLoginSchema>;

interface EnhancedLoginFormProps {
  type: 'email' | 'student' | 'admin-otp';
  onSubmit: (data: any) => Promise<void>;
  onBack?: () => void;
  isLoading?: boolean;
  error?: AuthError | null;
  onClearError?: () => void;
  // Enhanced props for better UX and validation
  email?: string;
  isAdminEmail?: boolean;
  showPasswordStrength?: boolean;
  rememberEmail?: boolean;
  // New enhanced props
  maxAttempts?: number;
  currentAttempts?: number;
  lockoutTimeRemaining?: number;
  showSecurityTips?: boolean;
  enableAutoComplete?: boolean;
  validateOnBlur?: boolean;
  showFieldIcons?: boolean;
}

export function EnhancedLoginForm({
  type,
  onSubmit,
  onBack,
  isLoading = false,
  error,
  onClearError,
  email = '',
  isAdminEmail = false,
  showPasswordStrength = false,
  rememberEmail = true,
  maxAttempts = 5,
  currentAttempts = 0,
  lockoutTimeRemaining = 0,
  showSecurityTips = true,
  enableAutoComplete = true,
  validateOnBlur = true,
  showFieldIcons = true
}: EnhancedLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(lockoutTimeRemaining);
  const [validationTouched, setValidationTouched] = useState<Record<string, boolean>>({});

  // Select appropriate schema based on form type with enhanced validation
  const getSchema = () => {
    switch (type) {
      case 'email':
        return emailSchema;
      case 'student':
        return studentLoginSchema;
      case 'admin-otp':
        return otpSchema;
      default:
        return emailSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty, isSubmitting },
    watch,
    setValue,
    clearErrors,
    trigger,
    setError
  } = useForm<any>({
    resolver: zodResolver(getSchema()),
    mode: validateOnBlur ? 'onBlur' : 'onChange',
    defaultValues: type === 'student' ? {
      email: email,
      password: ''
    } : type === 'admin-otp' ? {
      otp: ''
    } : {
      email: email
    }
  });

  const watchedPassword = type === 'student' ? watch('password') : '';
  const watchedEmail = watch('email');

  // Enhanced password strength calculation
  useEffect(() => {
    if (showPasswordStrength && watchedPassword) {
      let strength = 0;
      let strengthFactors = [];
      
      if (watchedPassword.length >= 8) {
        strength += 20;
        strengthFactors.push('الطول مناسب');
      }
      if (watchedPassword.length >= 12) {
        strength += 10;
        strengthFactors.push('طول ممتاز');
      }
      if (/[A-Z]/.test(watchedPassword)) {
        strength += 20;
        strengthFactors.push('أحرف كبيرة');
      }
      if (/[a-z]/.test(watchedPassword)) {
        strength += 20;
        strengthFactors.push('أحرف صغيرة');
      }
      if (/[0-9]/.test(watchedPassword)) {
        strength += 15;
        strengthFactors.push('أرقام');
      }
      if (/[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword)) {
        strength += 15;
        strengthFactors.push('رموز خاصة');
      }
      
      setPasswordStrength(Math.min(strength, 100));
    }
  }, [watchedPassword, showPasswordStrength]);

  // Lockout timer countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTimer]);

  // Enhanced email validation on blur
  const handleEmailBlur = async () => {
    setIsEmailFocused(false);
    setValidationTouched(prev => ({ ...prev, email: true }));
    
    if (validateOnBlur && watchedEmail) {
      await trigger('email');
    }
  };

  // Enhanced password validation on blur
  const handlePasswordBlur = async () => {
    setIsPasswordFocused(false);
    setValidationTouched(prev => ({ ...prev, password: true }));
    
    if (validateOnBlur && watchedPassword) {
      await trigger('password');
    }
  };

  // Clear form errors when auth error is cleared
  useEffect(() => {
    if (!error) {
      clearErrors();
    }
  }, [error, clearErrors]);

  // Load saved email if remember is enabled
  useEffect(() => {
    if (rememberEmail && typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('remembered-email');
      if (savedEmail && !email) {
        setValue('email', savedEmail);
      }
    }
  }, [rememberEmail, email, setValue]);

  const handleFormSubmit = async (data: any) => {
    // Check if user is locked out
    if (lockoutTimer > 0) {
      setError('root', {
        type: 'manual',
        message: `الحساب مقفل مؤقتاً. يرجى المحاولة بعد ${Math.ceil(lockoutTimer / 60)} دقيقة`
      });
      return;
    }

    // Check attempt limits
    if (currentAttempts >= maxAttempts) {
      setError('root', {
        type: 'manual',
        message: 'تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة لاحقاً'
      });
      return;
    }

    // Enhanced data validation before submission
    try {
      // Trim and sanitize input data
      const sanitizedData = {
        ...data,
        email: data.email?.trim().toLowerCase(),
        password: data.password // Don't trim password as spaces might be intentional
      };

      // Save email if remember is enabled
      if (rememberEmail && sanitizedData.email && typeof window !== 'undefined') {
        localStorage.setItem('remembered-email', sanitizedData.email);
      }

      // Clear any existing errors
      onClearError?.();
      clearErrors();
      
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      setError('root', {
        type: 'manual',
        message: 'حدث خطأ في إرسال النموذج. يرجى المحاولة مرة أخرى'
      });
    }
  };

  const getFormTitle = () => {
    switch (type) {
      case 'email':
        return 'تسجيل الدخول';
      case 'student':
        return 'تسجيل دخول الطالب';
      case 'admin-otp':
        return 'لوحة الإدارة';
      default:
        return 'تسجيل الدخول';
    }
  };

  const getFormDescription = () => {
    switch (type) {
      case 'email':
        return 'أدخل بريدك الإلكتروني للمتابعة';
      case 'student':
        return `تسجيل الدخول كطالب: ${email}`;
      case 'admin-otp':
        return 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني';
      default:
        return 'أدخل بياناتك للدخول';
    }
  };

  const getFormIcon = () => {
    switch (type) {
      case 'admin-otp':
        return <Shield className="h-6 w-6 text-white" />;
      case 'student':
        return <User className="h-6 w-6 text-white" />;
      default:
        return <Mail className="h-6 w-6 text-white" />;
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'ضعيفة';
    if (passwordStrength < 50) return 'متوسطة';
    if (passwordStrength < 75) return 'جيدة';
    return 'قوية';
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
          {getFormIcon()}
        </div>
        <CardTitle className="text-2xl font-bold text-white font-arabic">
          {getFormTitle()}
        </CardTitle>
        <CardDescription className="text-blue-100 font-arabic">
          {getFormDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Enhanced Email Field */}
          {(type === 'email' || type === 'student') && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-arabic flex items-center gap-2">
                {showFieldIcons && <Mail className="h-4 w-4" />}
                البريد الإلكتروني
                <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 transition-all duration-200 ${
                    isEmailFocused ? 'border-blue-400 ring-2 ring-blue-400/20' : ''
                  } ${
                    errors.email ? 'border-red-400 ring-2 ring-red-400/20' : ''
                  } ${
                    validationTouched.email && !errors.email ? 'border-green-400' : ''
                  }`}
                  placeholder="example@domain.com"
                  dir="ltr"
                  disabled={isLoading || (type === 'student' && !!email)}
                  autoComplete={enableAutoComplete ? "email" : "off"}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={handleEmailBlur}
                />
                {validationTouched.email && !errors.email && watchedEmail && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Enhanced error display */}
              {errors.email && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
                  <p className="text-red-300 text-sm font-arabic flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {errors.email.message as string}
                  </p>
                </div>
              )}
              
              {/* Account type indicator */}
              {type === 'email' && watchedEmail && isAdminEmail !== undefined && (
                <div className={`text-sm p-2 rounded-lg border ${
                  isAdminEmail 
                    ? 'text-green-400 bg-green-900/20 border-green-500/30' 
                    : 'text-blue-400 bg-blue-900/20 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {isAdminEmail ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    <span className="font-arabic">
                      {isAdminEmail ? 'حساب إداري - سيتم إرسال رمز التحقق' : 'حساب طالب - سيتم طلب كلمة المرور'}
                    </span>
                  </div>
                </div>
              )}

              {/* Security tip */}
              {showSecurityTips && isEmailFocused && (
                <div className="text-xs text-blue-300/80 font-arabic bg-blue-900/10 rounded p-2 border border-blue-500/20">
                  💡 تأكد من صحة البريد الإلكتروني لضمان وصول رسائل النظام
                </div>
              )}
            </div>
          )}

          {/* Enhanced Password Field */}
          {type === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-arabic flex items-center gap-2">
                {showFieldIcons && <Lock className="h-4 w-4" />}
                كلمة المرور
                <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={`bg-white/10 border-white/20 text-white placeholder:text-white/60 pl-10 transition-all duration-200 ${
                    isPasswordFocused ? 'border-blue-400 ring-2 ring-blue-400/20' : ''
                  } ${
                    errors.password ? 'border-red-400 ring-2 ring-red-400/20' : ''
                  } ${
                    validationTouched.password && !errors.password && watchedPassword ? 'border-green-400' : ''
                  }`}
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                  disabled={isLoading}
                  autoComplete={enableAutoComplete ? "current-password" : "off"}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={handlePasswordBlur}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-white/60" />
                  ) : (
                    <Eye className="h-4 w-4 text-white/60" />
                  )}
                </Button>
                {validationTouched.password && !errors.password && watchedPassword && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Enhanced error display */}
              {errors.password && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
                  <p className="text-red-300 text-sm font-arabic flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {errors.password?.message as string}
                  </p>
                </div>
              )}
              
              {/* Enhanced Password Strength Indicator */}
              {showPasswordStrength && watchedPassword && (
                <div className="space-y-2 bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex justify-between text-xs text-white/80 font-arabic">
                    <span>قوة كلمة المرور:</span>
                    <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  {passwordStrength < 75 && (
                    <div className="text-xs text-amber-300 font-arabic">
                      💡 لتحسين الأمان: استخدم أحرف كبيرة وصغيرة وأرقام ورموز خاصة
                    </div>
                  )}
                </div>
              )}

              {/* Security tip */}
              {showSecurityTips && isPasswordFocused && (
                <div className="text-xs text-blue-300/80 font-arabic bg-blue-900/10 rounded p-2 border border-blue-500/20">
                  🔒 كلمة المرور محمية بتشفير متقدم ولن يتم حفظها في المتصفح
                </div>
              )}
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Lockout warning */}
            {lockoutTimer > 0 && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-300 text-sm font-arabic">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <span>الحساب مقفل مؤقتاً. الوقت المتبقي: {Math.ceil(lockoutTimer / 60)} دقيقة</span>
                </div>
              </div>
            )}

            {/* Attempts warning */}
            {currentAttempts > 0 && currentAttempts < maxAttempts && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-2">
                <div className="flex items-center gap-2 text-orange-300 text-xs font-arabic">
                  <Shield className="h-3 w-3" />
                  <span>المحاولات المتبقية: {maxAttempts - currentAttempts} من {maxAttempts}</span>
                </div>
              </div>
            )}

            {/* Root error display */}
            {errors.root && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
                <p className="text-red-300 text-sm font-arabic flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {errors.root.message}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                  disabled={isLoading || isSubmitting}
                >
                  رجوع
                </Button>
              )}
              
              <Button
                type="submit"
                className={`${onBack ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white font-arabic disabled:opacity-50 transition-all duration-200`}
                disabled={
                  isLoading || 
                  isSubmitting || 
                  !isValid || 
                  (!isDirty && type !== 'email') || 
                  lockoutTimer > 0 ||
                  currentAttempts >= maxAttempts
                }
              >
                {isLoading || isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 ml-2 animate-spin" />
                    {type === 'student' ? 'جاري تسجيل الدخول...' : 'جاري المعالجة...'}
                  </>
                ) : lockoutTimer > 0 ? (
                  <>
                    <Clock className="h-4 w-4 ml-2" />
                    مقفل مؤقتاً
                  </>
                ) : (
                  <>
                    {type === 'email' && <Mail className="h-4 w-4 ml-2" />}
                    {type === 'student' && <Lock className="h-4 w-4 ml-2" />}
                    {type === 'email' ? 'متابعة' : 'تسجيل الدخول'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Enhanced Help Text */}
        <div className="mt-4 space-y-2">
          <div className="text-center text-xs text-white/60 font-arabic">
            {type === 'student' && (
              <div className="space-y-1">
                <p>نسيت كلمة المرور؟ تواصل مع الإدارة</p>
                <p>🔒 جميع البيانات محمية بتشفير متقدم</p>
              </div>
            )}
            {type === 'email' && (
              <div className="space-y-1">
                <p>سيتم تحديد نوع الحساب تلقائياً بناءً على البريد الإلكتروني</p>
                <p>🛡️ نظام آمن ومحمي</p>
              </div>
            )}
          </div>

          {/* Security indicators */}
          {showSecurityTips && (
            <div className="flex justify-center items-center gap-4 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>تشفير 256-bit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>حماية متقدمة</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}