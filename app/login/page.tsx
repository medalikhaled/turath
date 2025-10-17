"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthContext } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Shield, Clock, User, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

type LoginStep = "email" | "student-password" | "admin-otp"

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<LoginStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    loginStudent,
    loginAdmin,
    sendOTP,
    isAuthenticated,
    user,
    error: authError,
    clearError,

    isLoggingIn,
    isSendingOTP,
  } = useAuthContext()

  // Check if email is admin email with timeout handling
  const adminEmailCheck = useQuery(api.authFunctions.isAdminEmail, email ? { email } : "skip")
  const isAdminEmail = adminEmailCheck?.isAdmin === true
  const isAdminEmailLoading = adminEmailCheck === undefined && email
  
  // Add timeout for admin email check to prevent infinite loading
  useEffect(() => {
    if (email && isAdminEmailLoading) {
      const timeout = setTimeout(() => {
        console.warn('Admin email check timed out, defaulting to student flow');
        // If admin check takes too long, we'll handle it in the submit
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [email, isAdminEmailLoading])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check for intended path from middleware
      const intendedPath = sessionStorage.getItem('intended-path');
      if (intendedPath) {
        sessionStorage.removeItem('intended-path');
        router.push(intendedPath);
      } else {
        // Default redirect based on user role
        const defaultPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(defaultPath);
      }
    }
  }, [isAuthenticated, user?.role, router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("يرجى إدخال البريد الإلكتروني")
      return
    }

    // Clear any existing errors
    clearError()
    setIsLoading(true)

    try {
      // Check if we're still waiting for admin email validation
      if (isAdminEmailLoading) {
        // Wait a bit more, but don't block forever
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // If still loading after wait, proceed with manual check
        if (adminEmailCheck === undefined) {
          console.log("⚠️ Admin email check timed out, proceeding with manual detection");
          
          // Manual check: if email contains admin indicators, try admin flow first
          const emailLower = email.toLowerCase();
          const isLikelyAdmin = emailLower.includes('admin') || emailLower === 'medalikhaled331@gmail.com';
          
          if (isLikelyAdmin) {
            console.log("🔍 Likely admin email detected (manual), trying OTP flow...");
            const result = await sendOTP(email);
            
            if (result.success) {
              toast.success(result.message || "تم إرسال رمز التحقق بنجاح");
              console.log("✅ OTP sent successfully, switching to OTP step");
              setStep("admin-otp");
              return;
            } else {
              console.log("❌ OTP failed, falling back to student flow");
              toast.info("سيتم التعامل مع الحساب كحساب طالب");
              setStep("student-password");
              return;
            }
          } else {
            console.log("👤 Non-admin email detected (manual), switching to password step");
            setStep("student-password");
            return;
          }
        }
      }

      // Normal flow when admin check is complete
      if (isAdminEmail) {
        // Admin flow - request OTP using enhanced sendOTP function
        console.log("🔍 Admin email confirmed, sending OTP...");
        const result = await sendOTP(email);

        if (result.success) {
          toast.success(result.message || "تم إرسال رمز التحقق بنجاح");
          console.log("✅ OTP sent successfully, switching to OTP step");
          setStep("admin-otp");
        } else {
          console.error("❌ OTP sending failed:", result.error);
          toast.error(result.error || "حدث خطأ في طلب رمز التحقق");
        }
      } else {
        // Student flow - go to password step
        console.log("👤 Student email confirmed, switching to password step");
        setStep("student-password");
      }
    } catch (error) {
      console.error("Email verification error:", error)
      toast.error("حدث خطأ في التحقق من البريد الإلكتروني")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      toast.error("يرجى إدخال كلمة المرور")
      return
    }

    // Clear any existing errors
    clearError()

    const result = await loginStudent({ identifier: email, password })

    if (!result.success) {
      // Error handling is done in the useAuth hook with enhanced error display
      console.error("Student login failed:", result.error)
    }
  }

  const handleOTPVerify = async (otp: string) => {
    // Clear any existing errors
    clearError()

    const result = await loginAdmin({ email, otp })

    return {
      success: result.success,
      error: result.error
    }
  }

  const handleOTPResend = async () => {
    const result = await sendOTP(email)
    return {
      success: result.success,
      error: result.error
    }
  }

  const handleBack = () => {
    if (step === "student-password" || step === "admin-otp") {
      setStep("email")
      setPassword("")
      clearError() // Clear any errors when going back
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to main site link */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للموقع الرئيسي
          </Link>
        </div>


        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              {step === "admin-otp" ? (
                <Shield className="h-6 w-6 text-white" />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white font-arabic">
              {step === "admin-otp" ? "لوحة الإدارة" : "تراث الحنابلة"}
            </CardTitle>
            <CardDescription className="text-blue-100 font-arabic">
              {step === "email" && "تسجيل الدخول للمنصة"}
              {step === "student-password" && "تسجيل دخول الطالب"}
              {step === "admin-otp" && "تسجيل الدخول للمدراء والمشرفين"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-arabic">
                    اسم المستخدم أو البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                    dir="ltr"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-arabic disabled:opacity-50"
                  disabled={isLoading || isSendingOTP || !email}
                >
                  {isLoading || isSendingOTP ? (
                    <>
                      <Clock className="h-4 w-4 ml-2 animate-spin" />
                      {isSendingOTP ? 'جاري إرسال الرمز...' : 'جاري التحقق...'}
                    </>
                  ) : (
                    "متابعة"
                  )}
                </Button>
              </form>
            )}

            {step === "student-password" && (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-white/80 font-arabic text-sm">
                    تسجيل الدخول كطالب: <strong>{email}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-arabic">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pl-10"
                      placeholder="أدخل كلمة المرور"
                      dir="ltr"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-white/60" />
                      ) : (
                        <Eye className="h-4 w-4 text-white/60" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    disabled={isLoading || isLoggingIn}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-arabic disabled:opacity-50"
                    disabled={isLoading || isLoggingIn || !password}
                  >
                    {isLoading || isLoggingIn ? (
                      <>
                        <Lock className="h-4 w-4 ml-2 animate-spin" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      "تسجيل الدخول"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === "admin-otp" && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-white/80 font-arabic text-sm">
                    أدخل رمز التحقق: <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const otp = formData.get('otp') as string;
                  if (otp && otp.length === 6) {
                    handleOTPVerify(otp);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-white font-arabic">
                      رمز التحقق (6 أرقام)
                    </Label>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/60 text-center text-lg font-mono"
                      placeholder="123456"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                      disabled={isLoading || isLoggingIn}
                    >
                      رجوع
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-arabic disabled:opacity-50"
                      disabled={isLoading || isLoggingIn}
                    >
                      {isLoading || isLoggingIn ? (
                        <>
                          <Clock className="h-4 w-4 ml-2 animate-spin" />
                          جاري التحقق...
                        </>
                      ) : (
                        "تحقق"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleOTPResend}
                    className="text-blue-300 hover:text-blue-200 font-arabic"
                    disabled={isLoading || isSendingOTP}
                  >
                    {isSendingOTP ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}