"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogout() {
  const authActions = useAuthActions()
  const router = useRouter()

  const logout = async () => {
    try {
      if (authActions?.signOut) {
        await authActions.signOut()
        toast.success("تم تسجيل الخروج بنجاح")
        router.push("/sign-in")
      } else {
        console.error("Auth actions not available")
        toast.error("خدمة المصادقة غير متاحة")
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("حدث خطأ أثناء تسجيل الخروج")
    }
  }

  return { logout }
}