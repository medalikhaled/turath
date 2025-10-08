"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpenIcon, 
  CalendarIcon, 
  ClockIcon,
  UserIcon,
  ArrowLeftIcon,
  FileIcon
} from "lucide-react"

interface CourseCardProps {
  course: {
    _id: string
    name: string
    description?: string
    instructor: string
    isActive: boolean
    createdAt: number
  }
  nextLesson?: {
    _id: string
    title: string
    scheduledTime: number
  } | null
  upcomingMeetings?: any[]
  progressInfo?: {
    completedLessons: number
    totalLessons: number
    resourcesCount: number
  }
  onClick: (courseId: string) => void
}

export function CourseCard({ 
  course, 
  nextLesson, 
  upcomingMeetings = [], 
  progressInfo,
  onClick 
}: CourseCardProps) {
  const handleClick = () => {
    onClick(course._id)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-SA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="arabic-text text-lg flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              {course.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span className="arabic-text">{course.instructor}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={course.isActive ? "default" : "secondary"} className="arabic-text">
              {course.isActive ? "نشط" : "غير نشط"}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Course Description */}
        {course.description && (
          <p className="text-sm text-muted-foreground arabic-text line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Next Lesson Info */}
        {nextLesson ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="arabic-text">الدرس القادم</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium arabic-text">{nextLesson.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                <span className="arabic-text">{formatDate(nextLesson.scheduledTime)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground arabic-text">
              لا توجد دروس قادمة
            </p>
          </div>
        )}

        {/* Progress Info */}
        {progressInfo && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="arabic-text">
                {progressInfo.completedLessons} من {progressInfo.totalLessons} دروس
              </span>
            </div>
            {progressInfo.resourcesCount > 0 && (
              <div className="flex items-center gap-1">
                <FileIcon className="h-3 w-3" />
                <span className="arabic-text">{progressInfo.resourcesCount} مورد</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}