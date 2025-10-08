"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

interface DashboardData {
  weeklySchedule: any[]
  courses: any[]
  recentNews: any[]
  nextLesson: any | null
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
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Retry function to force re-fetch of all queries
  const retry = React.useCallback(() => {
    setRetryKey(prev => prev + 1)
  }, [])
  
  // Calculate time period for weekly schedule
  const now = Date.now()
  const startOfWeek = now - (now % (7 * 24 * 60 * 60 * 1000))
  const endOfWeek = startOfWeek + (7 * 24 * 60 * 60 * 1000)
  
  // Use simplified direct queries instead of complex student-based filtering
  // The retryKey will cause the component to re-render and re-execute queries
  const weeklyLessons = useQuery(
    api.dashboard.getAllLessonsForPeriod,
    mounted && retryKey >= 0 ? { startTime: startOfWeek, endTime: endOfWeek } : "skip"
  )
  
  const courses = useQuery(
    api.dashboard.getAllActiveCourses,
    mounted && retryKey >= 0 ? {} : "skip"
  )
  
  const recentNews = useQuery(
    api.dashboard.getAllPublishedNews,
    mounted && retryKey >= 0 ? { limit: 5 } : "skip"
  )
  
  // Find next lesson from the weekly schedule
  const nextLesson = React.useMemo(() => {
    if (!weeklyLessons || weeklyLessons.length === 0) return null
    
    const upcomingLessons = weeklyLessons.filter(lesson => lesson.scheduledTime > now)
    return upcomingLessons.length > 0 ? upcomingLessons[0] : null
  }, [weeklyLessons, now])
  
  // Determine loading state
  const isLoading = !mounted || 
    weeklyLessons === undefined || 
    courses === undefined || 
    recentNews === undefined
  
  // Handle errors with specific error messages
  const error = React.useMemo(() => {
    if (!mounted) return null
    
    // Check for specific query failures and provide appropriate error messages
    if (weeklyLessons === null) {
      return new Error("Unable to load weekly schedule. Please check your connection and try again.")
    }
    
    if (courses === null) {
      return new Error("Unable to load courses. Please check your connection and try again.")
    }
    
    if (recentNews === null) {
      return new Error("Unable to load recent news. Please check your connection and try again.")
    }
    
    return null
  }, [mounted, weeklyLessons, courses, recentNews])
  
  // Construct dashboard data with empty state information
  const data = React.useMemo((): DashboardData | null => {
    if (isLoading || error) return null
    
    const lessonsArray = weeklyLessons || []
    const coursesArray = courses || []
    const newsArray = recentNews || []
    
    // Determine empty states
    const isEmpty = {
      lessons: lessonsArray.length === 0,
      courses: coursesArray.length === 0,
      news: newsArray.length === 0,
      all: lessonsArray.length === 0 && coursesArray.length === 0 && newsArray.length === 0
    }
    
    return {
      weeklySchedule: lessonsArray,
      courses: coursesArray,
      recentNews: newsArray,
      nextLesson,
      isEmpty
    }
  }, [weeklyLessons, courses, recentNews, nextLesson, isLoading, error])
  
  return {
    data,
    isLoading,
    error,
    retry
  }
}
