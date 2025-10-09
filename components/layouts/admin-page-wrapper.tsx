"use client"

import * as React from "react"
import { AdminLayout } from "./admin-layout"
import { useAdminNavigation } from "@/hooks/use-admin-navigation"

interface AdminPageWrapperProps {
  children: React.ReactNode
  currentPage?: string
  className?: string
  showBackButton?: boolean
  customBreadcrumbs?: Array<{ label: string; href?: string; isActive?: boolean }>
}

export function AdminPageWrapper({ 
  children, 
  currentPage,
  className,
  showBackButton: customShowBackButton,
  customBreadcrumbs
}: AdminPageWrapperProps) {
  const { breadcrumbs, showBackButton, backUrl, goBack } = useAdminNavigation()

  return (
    <AdminLayout
      currentPage={currentPage}
      className={className}
      showBackButton={customShowBackButton ?? showBackButton}
      backUrl={backUrl}
      breadcrumbs={customBreadcrumbs ?? breadcrumbs}
    >
      {children}
    </AdminLayout>
  )
}