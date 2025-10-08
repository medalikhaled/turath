"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseCard } from "./course-card"
import { 
  BookOpenIcon, 
  AlertCircleIcon,
  RefreshCwIcon,
  PlusIcon
} from "lucide-react"

interface Course {
  _id: string
  name: string
  description?: string
  instructor: string
  isActive: boolean
  createdAt: number
}

interface CourseSectionProps {
  courses: Course[]
  isLoading?: boolean
  error?: Error | null
  onCourseClick: (courseId: string) => void
  onRetry?: () => void
  showHeader?: boolean
  maxCourses?: number
}

export function CourseSection({ 
  courses, 
  isLoading = false, 
  error = null,
  onCourseClick,
  onRetry,
  showHeader = true,
  maxCourses
}: CourseSectionProps) {
  // Limit courses if maxCourses is specified
  const displayedCourses = maxCourses ? courses.slice(0, maxCourses) : courses
  const hasMoreCourses = maxCourses && courses.length > maxCourses

  if (isLoading) {
    return <CourseSectionSkeleton showHeader={showHeader} />
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              دوراتي
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <CourseErrorState error={error} onRetry={onRetry} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="arabic-text flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary" />
              دوراتي
              {courses.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({courses.length})
                </span>
              )}
            </CardTitle>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-8 w-8 p-0"
              >
                <RefreshCwIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        {courses.length === 0 ? (
          <CourseEmptyState />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {displayedCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onClick={onCourseClick}
                  // TODO: Add next lesson and progress info when available
                  nextLesson={null}
                  progressInfo={undefined}
                />
              ))}
            </div>
            
            {hasMoreCourses && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="arabic-text"
                  onClick={() => {
                    // Show all courses by removing the limit
                    // This could be implemented as a state toggle or navigation to a full courses page
                    console.log("Show all courses - could expand the current view or navigate to /courses")
                  }}
                >
                  عرض جميع الدورات ({courses.length - maxCourses!} أخرى)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CourseEmptyState() {
  return (
    <div className="text-center py-8">
      <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="font-semibold arabic-text mb-2">
        لا توجد دورات مسجلة
      </h3>
      <p className="text-muted-foreground arabic-text mb-4">
        لم يتم تسجيلك في أي دورات بعد. تواصل مع الإدارة للتسجيل في الدورات المتاحة.
      </p>
      <Button variant="outline" className="arabic-text gap-2">
        <PlusIcon className="h-4 w-4" />
        تصفح الدورات المتاحة
      </Button>
    </div>
  )
}

function CourseErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="font-semibold arabic-text mb-2">
        خطأ في تحميل الدورات
      </h3>
      <p className="text-muted-foreground arabic-text mb-4">
        {error.message || "حدث خطأ أثناء تحميل الدورات. يرجى المحاولة مرة أخرى."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="arabic-text gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  )
}

function CourseSectionSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}