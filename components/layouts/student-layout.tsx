"use client"

import * as React from "react"
import { Navigation } from "@/components/shared/navigation"
import { useLogout } from "@/hooks/use-logout"
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
  userName = "الطالب",
  onSignOut 
}: StudentLayoutProps) {
  const { logout } = useLogout()
  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userType="student" 
        userName={userName}
        onSignOut={onSignOut || logout}
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