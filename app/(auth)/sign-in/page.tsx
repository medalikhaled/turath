"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const authActions = useAuthActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (authActions?.signIn) {
        await authActions.signIn("password", { email, password, flow: "signIn" })
        toast.success("تم تسجيل الدخول بنجاح")
        router.push("/dashboard")
      } else {
        throw new Error("Auth actions not available")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error("خطأ في تسجيل الدخول", {
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white font-arabic">
          تراث الحنابلة
        </CardTitle>
        <CardDescription className="text-blue-100 font-arabic">
          منصة التعلم الإسلامي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-arabic"
            disabled={isLoading}
          >
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>
        
        {/* <div className="mt-4 text-center">
          <p className="text-white/80 font-arabic text-sm">
            ليس لديك حساب؟{" "}
            <Link href="/sign-up" className="text-blue-300 hover:text-blue-200 underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </div> */}
      </CardContent>
    </Card>
  )
}