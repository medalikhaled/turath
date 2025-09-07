"use client"

import * as React from "react"
import { StudentLayout } from "@/components/layouts/student-layout"
import { CurrentLessonCard } from "./current-lesson-card"
import { WeeklySchedule } from "./weekly-schedule"
import { EnhancedNewsFeed } from "./enhanced-news-feed"
import { useStudentDashboard } from "@/hooks/use-student-dashboard"
import { LoadingStates } from "@/components/shared/loading-states"
import { SeedDataButton } from "./seed-data-button"

export function StudentDashboard() {
  const { data, isLoading, error } = useStudentDashboard()

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
            <SeedDataButton />
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout userName={data?.student?.name}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          {/* <div className="text-center py-6">
            <h1 className="text-3xl font-bold arabic-text mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              مرحباً {data?.student?.name || "بك"}
            </h1>
            <p className="text-muted-foreground arabic-text text-lg">
              لوحة التحكم الخاصة بك في أكاديمية تراث الحنابلة
            </p>
          </div> */}

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