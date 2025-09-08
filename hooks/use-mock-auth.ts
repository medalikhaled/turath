"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Mock auth for testing without Convex Auth
export function useMockAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  const signIn = async (email: string, password: string) => {
    // Mock authentication - just check if email/password are provided
    if (email && password) {
      const mockUser = {
        id: "mock-user-id",
        name: "أحمد محمد",
        email: email,
        role: email.includes("admin") ? "admin" : "student"
      }
      
      setUser(mockUser)
      setIsAuthenticated(true)
      localStorage.setItem("mockUser", JSON.stringify(mockUser))
      
      toast.success("تم تسجيل الدخول بنجاح")
      router.push("/dashboard")
      return true
    } else {
      toast.error("البريد الإلكتروني وكلمة المرور مطلوبان")
      return false
    }
  }

  const signOut = async () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("mockUser")
    toast.success("تم تسجيل الخروج بنجاح")
    router.push("/sign-in")
  }

  // Check for existing session on mount
  const checkAuth = () => {
    const savedUser = localStorage.getItem("mockUser")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setUser(user)
      setIsAuthenticated(true)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading: false,
    signIn,
    signOut,
    checkAuth
  }
}