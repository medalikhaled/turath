"use client"

import * as React from "react"
import { ChevronLeftIcon, HomeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showBackButton?: boolean
  backUrl?: string
  onBack?: () => void
}

export function Breadcrumb({ 
  items, 
  className, 
  showBackButton = false, 
  backUrl,
  onBack 
}: BreadcrumbProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backUrl) {
      window.location.href = backUrl
    } else {
      window.history.back()
    }
  }

  return (
    <nav className={cn("flex items-center space-x-2 rtl:space-x-reverse", className)}>
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">رجوع</span>
        </Button>
      )}
      
      <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0 overflow-hidden">
        <HomeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronLeftIcon className="h-4 w-4 text-muted-foreground rotate-180 shrink-0" />
            
            {item.href && !item.isActive ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground min-w-0"
                asChild
              >
                <a href={item.href}>
                  <span className="arabic-text truncate">{item.label}</span>
                </a>
              </Button>
            ) : (
              <span className={cn(
                "text-sm arabic-text truncate",
                item.isActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}

// Utility function to generate breadcrumbs from pathname
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  
  // Remove 'admin' from segments if present
  const adminIndex = segments.indexOf('admin')
  if (adminIndex !== -1) {
    segments.splice(adminIndex, 1)
  }

  const breadcrumbs: BreadcrumbItem[] = []

  // Add dashboard as home
  breadcrumbs.push({
    label: "لوحة التحكم",
    href: "/admin/dashboard",
    isActive: segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')
  })

  // Map segments to Arabic labels
  const segmentLabels: Record<string, string> = {
    'courses': 'المقررات',
    'meetings': 'الجلسات',
    'schedule': 'الجدول الأسبوعي',
    'news': 'الأخبار والإعلانات',
    'students': 'الطلاب',
    'create': 'إنشاء جديد',
    'edit': 'تعديل',
    'view': 'عرض'
  }

  let currentPath = '/admin'
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    const label = segmentLabels[segment] || segment

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      isActive: isLast
    })
  })

  return breadcrumbs
}