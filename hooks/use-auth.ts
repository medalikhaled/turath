"use client"

import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"

export function useAuth() {
  const { signIn, signOut } = useAuthActions()
  
  const user = useQuery(api.auth.getCurrentUser)
  
  return {
    user,
    isLoading: user === undefined,
    isAuthenticated: user !== null,
    signIn,
    signOut
  }
}