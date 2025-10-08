"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Mail, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const requestOTP = useMutation(api.otp.requestAdminOTP)
  const verifyOTP = useMutation(api.otp.verifyAdminOTP)
  const isAdminEmail = useQuery(api.otp.isAdminEmail, { email })

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await requestOTP({ email })

      if (result.success) {
        toast.success(result.message)
        setStep("otp")

        // In development, show the OTP for testing
        if (result.otp) {
          toast.info(`رمز التحقق (للتطوير فقط): ${result.otp}`, {
            duration: 10000,
          })
        }
      }
    } catch (error: any) {
      console.error("OTP request error:", error)
      toast.error(error.message || "حدث خطأ في طلب رمز التحقق")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await verifyOTP({ email, otp })

      if (result.success) {
        toast.success(result.message)

        // Store session info in localStorage for client-side session management
        localStorage.setItem("adminSession", JSON.stringify({
          sessionId: result.sessionId,
          email: email,
          expiresAt: result.expiresAt,
        }))

        router.push("/admin/dashboard")
      }
    } catch (error: any) {
      console.error("OTP verification error:", error)
      toast.error(error.message || "حدث خطأ في التحقق من رمز التحقق")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep("email")
    setOtp("")
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
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white font-arabic">
              لوحة الإدارة
            </CardTitle>
            <CardDescription className="text-blue-100 font-arabic">
              تسجيل الدخول للمدراء والمشرفين
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-arabic">
                    البريد الإلكتروني للمشرف
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
                    <p className={`text-sm ${isAdminEmail ? 'text-green-400' : 'text-red-400'}`}>
                      {isAdminEmail ? '✓ بريد إلكتروني مصرح' : '✗ بريد إلكتروني غير مصرح'}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-arabic"
                  disabled={isLoading || !email || isAdminEmail === false}
                >
                  {isLoading ? (
                    <>
                      <Clock className="h-4 w-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 ml-2" />
                      إرسال رمز التحقق
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
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
                  onClick={handleRequestOTP}
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
