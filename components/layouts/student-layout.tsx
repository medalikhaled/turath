"use client"

import * as React from "react"
import { Navigation } from "@/components/shared/navigation"
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
  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userType="student" 
        userName={userName}
        onSignOut={onSignOut}
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