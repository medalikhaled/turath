"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { StudentLayout } from "@/components/layouts/student-layout"
import { CurrentLessonCard } from "./current-lesson-card"
import { WeeklySchedule } from "./weekly-schedule"
import { EnhancedNewsFeed } from "./enhanced-news-feed"
import { CourseSection } from "./course-section"
import { useStudentDashboard } from "@/hooks/use-student-dashboard"
import { LoadingStates } from "@/components/shared/loading-states"

export function StudentDashboard() {
  const router = useRouter()
  const { data, isLoading, error, retry } = useStudentDashboard()
  const { user } = require("@/providers/auth-provider").useAuthContext()

  const handleCourseClick = (courseId: string) => {
    router.push(`/course/${courseId}`)
  }

  if (isLoading) {
    return (
      <StudentLayout>
        <LoadingStates.Dashboard />
      </StudentLayout>
    )
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-destructive arabic-text mb-2">
              خطأ في تحميل البيانات
            </h2>
            <p className="text-muted-foreground arabic-text">
              حدث خطأ أثناء تحميل لوحة التحكم. يرجى المحاولة مرة أخرى.
            </p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Admin Link */}
          {user?.role === 'admin' && (
            <div className="flex justify-end">
              <a
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="arabic-text">لوحة الإدارة</span>
              </a>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Current Lesson Section */}
            <div className="lg:col-span-1">
              <CurrentLessonCard
                currentMeeting={data?.currentMeeting}
                nextLesson={data?.nextLesson}
              />
            </div>

            {/* Weekly Schedule */}
            <div className="lg:col-span-2">
              <WeeklySchedule
                weeklySchedule={data?.weeklySchedule || []}
              />
            </div>
          </div>

          {/* Course Section - Below the main grid */}
          <CourseSection
            courses={data?.courses || []}
            isLoading={isLoading}
            error={data?.isEmpty?.courses ? null : error}
            onCourseClick={handleCourseClick}
            onRetry={retry}
            showHeader={true}
            maxCourses={6}
          />

          {/* News Feed */}
          <EnhancedNewsFeed
            limit={5}
            showHeader={true}
          />
        </div>
      </div>
    </StudentLayout>
  )
}