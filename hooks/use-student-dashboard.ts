"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthContext } from "@/providers/auth-provider"

interface DashboardData {
  student: any
  weeklySchedule: any[]
  courses: any[]
  recentNews: any[]
  nextLesson: any | null
  currentMeeting: any | null
  isEmpty: {
    lessons: boolean
    courses: boolean
    news: boolean
    all: boolean
  }
}

interface DashboardReturn {
  data: DashboardData | null
  isLoading: boolean
  error: Error | null
  retry: () => void
}

export function useStudentDashboard(): DashboardReturn {
  const [mounted, setMounted] = React.useState(false)
  const [retryKey, setRetryKey] = React.useState(0)
  const { user, isAuthenticated } = useAuthContext()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Retry function to force re-fetch of all queries
  const retry = React.useCallback(() => {
    setRetryKey(prev => prev + 1)
  }, [])

  // Get authenticated student dashboard data
  // Works for both students and admins
  const dashboardData = useQuery(
    api.dashboard.getStudentDashboardByUserId,
    mounted && isAuthenticated && user?.id && retryKey >= 0
      ? { userId: user.id as any }
      : "skip"
  )

  // Determine loading state
  const isLoading = !mounted || !isAuthenticated || dashboardData === undefined

  // Handle errors with specific error messages
  const error = React.useMemo(() => {
    if (!mounted || !isAuthenticated) return null

    // Check for specific query failures and provide appropriate error messages
    if (dashboardData === null) {
      return new Error("Unable to load dashboard data. Please check your connection and try again.")
    }

    return null
  }, [mounted, isAuthenticated, dashboardData])

  // Construct dashboard data with empty state information
  const data = React.useMemo((): DashboardData | null => {
    if (isLoading || error || !dashboardData) return null

    const lessonsArray = dashboardData.weeklySchedule || []
    const coursesArray = dashboardData.courses || []
    const newsArray = dashboardData.recentNews || []

    // Determine empty states
    const isEmpty = {
      lessons: lessonsArray.length === 0,
      courses: coursesArray.length === 0,
      news: newsArray.length === 0,
      all: lessonsArray.length === 0 && coursesArray.length === 0 && newsArray.length === 0
    }

    return {
      student: dashboardData.student,
      weeklySchedule: lessonsArray,
      courses: coursesArray,
      recentNews: newsArray,
      nextLesson: dashboardData.nextLesson,
      currentMeeting: dashboardData.currentMeeting,
      isEmpty
    }
  }, [dashboardData, isLoading, error])

  return {
    data,
    isLoading,
    error,
    retry
  }
}