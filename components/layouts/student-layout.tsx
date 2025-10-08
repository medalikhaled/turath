"use client"

import * as React from "react"
import { Navigation } from "@/components/shared/navigation"
import { useAuthContext } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

interface StudentLayoutProps {
  children: React.ReactNode
  className?: string
  userName?: string
  onSignOut?: () => void
}

export function StudentLayout({ 
  children, 
  className,
  userName,
  onSignOut 
}: StudentLayoutProps) {
  const { user, logout } = useAuthContext()
  
  // Use the authenticated user's name if not provided
  const displayName = userName || user?.name || "الطالب"
  
  const handleSignOut = onSignOut || logout
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userType="student" 
        userName={displayName}
        onSignOut={handleSignOut}
      />
      <main className={cn(
        "min-h-screen py-6",
        className
      )}>
        {children}
      </main>
    </div>
  )
}