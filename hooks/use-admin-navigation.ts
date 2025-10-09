"use client"

import { usePathname, useRouter } from "next/navigation"
import { useMemo } from "react"
import { generateBreadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumb"

export function useAdminNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const breadcrumbs = useMemo(() => {
    return generateBreadcrumbs(pathname)
  }, [pathname])

  const showBackButton = useMemo(() => {
    // Show back button for sub-routes (more than 2 segments after /admin)
    const segments = pathname.split('/').filter(Boolean)
    return segments.length > 2 && segments[0] === 'admin'
  }, [pathname])

  const backUrl = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length <= 2) return '/admin/dashboard'
    
    // Remove the last segment to go back one level
    const parentSegments = segments.slice(0, -1)
    return '/' + parentSegments.join('/')
  }, [pathname])

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(backUrl)
    }
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return {
    breadcrumbs,
    showBackButton,
    backUrl,
    goBack,
    navigateTo,
    currentPath: pathname
  }
}