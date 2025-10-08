"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { 
  filterCurrentWeekLessons, 
  getUpcomingLessons,
  getWeekStart,
  getWeekEnd 
} from "@/lib/schedule-validation"

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
  
  // Calculate time period for weekly schedule using proper week calculation
  const weekPeriod = React.useMemo(() => {
    const now = new Date()
    const startOfWeek = getWeekStart(now).getTime()
    const endOfWeek = getWeekEnd(now).getTime()
    return { startOfWeek, endOfWeek }
  }, []) // Empty dependency array since we want this to be calculated once per component mount
  
  // Use simplified direct queries instead of complex student-based filtering
  // The retryKey will cause the component to re-render and re-execute queries
  const weeklyLessons = useQuery(
    api.dashboard.getAllLessonsForPeriod,
    mounted && retryKey >= 0 ? { startTime: weekPeriod.startOfWeek, endTime: weekPeriod.endOfWeek } : "skip"
  )
  
  const courses = useQuery(
    api.dashboard.getAllActiveCourses,
    mounted && retryKey >= 0 ? {} : "skip"
  )
  
  const recentNews = useQuery(
    api.dashboard.getAllPublishedNews,
    mounted && retryKey >= 0 ? { limit: 5 } : "skip"
  )
  
  // Process lessons with proper filtering and sorting
  const processedLessons = React.useMemo(() => {
    if (!weeklyLessons || weeklyLessons.length === 0) return {
      currentWeekLessons: [],
      upcomingLessons: [],
      nextLesson: null
    }
    
    // Filter lessons for current week and sort them
    const currentWeekLessons = filterCurrentWeekLessons(weeklyLessons)
    
    // Get upcoming lessons (future lessons only)
    const upcomingLessons = getUpcomingLessons(weeklyLessons)
    
    // Next lesson is the first upcoming lesson
    const nextLesson = upcomingLessons.length > 0 ? upcomingLessons[0] : null
    
    return {
      currentWeekLessons,
      upcomingLessons,
      nextLesson
    }
  }, [weeklyLessons])
  
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
      lessons: processedLessons.currentWeekLessons.length === 0,
      courses: coursesArray.length === 0,
      news: newsArray.length === 0,
      all: processedLessons.currentWeekLessons.length === 0 && coursesArray.length === 0 && newsArray.length === 0
    }
    
    return {
      weeklySchedule: processedLessons.currentWeekLessons,
      courses: coursesArray,
      recentNews: newsArray,
      nextLesson: processedLessons.nextLesson,
      isEmpty
    }
  }, [weeklyLessons, courses, recentNews, processedLessons, isLoading, error])
  
  return {
    data,
    isLoading,
    error,
    retry
  }
}
