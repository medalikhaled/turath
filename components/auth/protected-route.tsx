"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const currentUser = useQuery(api.auth.getCurrentUser)
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && currentUser === null) {
      router.push("/sign-in")
    }
  }, [currentUser, requireAuth, router])

  if (requireAuth && currentUser === undefined) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 font-arabic">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && currentUser === null) {
    // Not authenticated
    return null
  }

  return <>{children}</>
}