"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, BookOpenIcon, ChevronLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatArabicDayHeader, formatArabicTime } from "@/lib/arabic-date"

interface WeeklyScheduleProps {
  weeklySchedule: Array<{
    _id: string
    title: string
    scheduledTime: number
    courseId: string
    course?: {
      _id: string
      _creationTime: number
      students: string[]
      name: string
      isActive: boolean
      description: string
      instructor: string
      createdAt: number
    } | null
    meetingId?: string
    description?: string
    recordingUrl?: string
    resources: string[]
  }>
}

export function WeeklySchedule({ weeklySchedule }: WeeklyScheduleProps) {
  const now = Date.now()
  
  // Group lessons by day
  const groupedLessons = React.useMemo(() => {
    const groups: { [key: string]: typeof weeklySchedule } = {}
    
    weeklySchedule.forEach(lesson => {
      const date = new Date(lesson.scheduledTime)
      const dayKey = date.toDateString()
      
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(lesson)
    })
    
    // Sort lessons within each day by time
    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => a.scheduledTime - b.scheduledTime)
    })
    
    return groups
  }, [weeklySchedule])

  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString)
    return formatArabicDayHeader(date.getTime())
  }

  const formatTime = (timestamp: number) => {
    return formatArabicTime(timestamp)
  }

  const isLessonPast = (timestamp: number) => timestamp < now
  const isLessonToday = (timestamp: number) => {
    const lessonDate = new Date(timestamp).toDateString()
    const today = new Date().toDateString()
    return lessonDate === today
  }

  if (weeklySchedule.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            الجدول الأسبوعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2">لا توجد دروس هذا الأسبوع</h3>
            <p className="text-muted-foreground arabic-text">
              لا توجد دروس مجدولة لهذا الأسبوع. تحقق مرة أخرى لاحقاً.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/10">
      <CardHeader className="pb-4">
        <CardTitle className="arabic-text flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <CalendarIcon className="h-5 w-5" />
          </div>
          الجدول الأسبوعي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedLessons).map(([dayKey, lessons]) => (
          <div key={dayKey} className="space-y-3">
            {/* Day Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
              <h3 className="font-semibold arabic-text text-lg">
                {formatDayHeader(dayKey)}
              </h3>
              {lessons.some(lesson => isLessonToday(lesson.scheduledTime)) && (
                <Badge className="arabic-text bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg">
                  📅 اليوم
                </Badge>
              )}
            </div>
            
            {/* Lessons for this day */}
            <div className="grid gap-2">
              {lessons.map(lesson => (
                <Link
                  key={lesson._id}
                  href={`/course/${lesson.courseId}`}
                  className="block"
                >
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md",
                    isLessonPast(lesson.scheduledTime) && "opacity-60 border-muted bg-muted/20",
                    isLessonToday(lesson.scheduledTime) && !isLessonPast(lesson.scheduledTime) 
                      ? "border-primary bg-gradient-to-r from-primary/10 to-blue-50/20 shadow-lg shadow-primary/20 hover:shadow-primary/30" 
                      : "border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/10 hover:border-primary/40"
                  )}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                          isLessonToday(lesson.scheduledTime) && !isLessonPast(lesson.scheduledTime) 
                            ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/30" 
                            : "bg-gradient-to-br from-muted to-muted/80 text-muted-foreground"
                        )}>
                          <BookOpenIcon className="h-6 w-6" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium arabic-text truncate">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatTime(lesson.scheduledTime)}</span>
                          </div>
                          {lesson.course && (
                            <span className="arabic-text truncate">
                              {lesson.course.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isLessonPast(lesson.scheduledTime) && (
                        <Badge variant="outline" className="arabic-text">انتهى</Badge>
                      )}
                      <ChevronLeftIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}