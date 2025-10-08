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
import { ArrowLeft, Mail, Shield, Clock, User, Lock } from "lucide-react"
import Link from "next/link"

type LoginStep = "email" | "student-password" | "admin-otp"

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<LoginStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const { loginStudent, loginAdmin, isAuthenticated } = useAuthContext()
  
  // Check if email is admin email
  const adminEmailCheck = useQuery(api.otp.isAdminEmail, email ? { email } : "skip")
  const isAdminEmail = adminEmailCheck?.isAdmin
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("يرجى إدخال البريد الإلكتروني")
      return
    }

    setIsLoading(true)

    try {
      if (isAdminEmail) {
        // Admin flow - request OTP
        const response = await fetch('/api/otp/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          toast.success(result.message)
          setStep("admin-otp")
          
          // In development, show the OTP for testing
          if (result.otp) {
            toast.info(`رمز التحقق (للتطوير فقط): ${result.otp}`, {
              duration: 10000,
            })
          }
        } else {
          toast.error(result.error || "حدث خطأ في طلب رمز التحقق")
        }
      } else {
        // Student flow - go to password step
        setStep("student-password")
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

    const result = await loginStudent({ email, password })
    
    if (!result.success) {
      // Error handling is done in the useAuth hook
      console.error("Student login failed:", result.error)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام")
      return
    }

    const result = await loginAdmin({ email, otp })
    
    if (!result.success) {
      // Error handling is done in the useAuth hook
      console.error("Admin login failed:", result.error)
    }
  }

  const handleBack = () => {
    if (step === "student-password" || step === "admin-otp") {
      setStep("email")
      setPassword("")
      setOtp("")
    }
  }

  const handleRequestNewOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("تم إرسال رمز تحقق جديد")
        
        // In development, show the OTP for testing
        if (result.otp) {
          toast.info(`رمز التحقق (للتطوير فقط): ${result.otp}`, {
            duration: 10000,
          })
        }
      } else {
        toast.error(result.error || "حدث خطأ في طلب رمز التحقق")
      }
    } catch (error) {
      console.error("OTP request error:", error)
      toast.error("حدث خطأ في الاتصال")
    } finally {
      setIsLoading(false)
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
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="أدخل بريدك الإلكتروني"
                    dir="ltr"
                  />
                  {email && isAdminEmail !== undefined && (
                    <p className={`text-sm ${isAdminEmail ? 'text-green-400' : 'text-blue-400'}`}>
                      {isAdminEmail ? '🛡️ حساب إداري - سيتم إرسال رمز التحقق' : '👤 حساب طالب - سيتم طلب كلمة المرور'}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-arabic"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 ml-2 animate-spin" />
                      جاري التحقق...
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
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    placeholder="أدخل كلمة المرور"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-arabic"
                    disabled={isLoading || !password}
                  >
                    {isLoading ? (
                      <>
                        <Lock className="h-4 w-4 ml-2" />
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
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-white/80 font-arabic text-sm">
                    تم إرسال رمز التحقق إلى: <strong>{email}</strong>
                  </p>
                  <p className="text-blue-200 font-arabic text-xs mt-2">
                    الرمز صالح لمدة 15 دقيقة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white font-arabic">
                    رمز التحقق (6 أرقام)
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 text-center text-lg tracking-widest"
                    placeholder="000000"
                    dir="ltr"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                    disabled={isLoading}
                  >
                    رجوع
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-arabic"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRequestNewOTP}
                  className="w-full text-blue-300 hover:text-blue-200"
                  disabled={isLoading}
                >
                  إعادة إرسال الرمز
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm font-arabic">
            نظام آمن محمي بتشفير متقدم
          </p>
        </div>
      </div>
    </div>
  )
}