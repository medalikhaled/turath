"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowRightIcon, 
  BookOpenIcon, 
  CalendarIcon, 
  ClockIcon,
  DownloadIcon,
  FileIcon,
  PlayCircleIcon,
  UserIcon,
  AlertCircleIcon
} from "lucide-react"
import Link from "next/link"

interface CoursePageProps {
  courseId: string
}

export function CoursePage({ courseId }: CoursePageProps) {
  const courseDetails = useQuery(api.courses.getCourseDetails, { 
    courseId: courseId as Id<"courses"> 
  })

  if (courseDetails === undefined) {
    return (
      <StudentLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <CoursePageSkeleton />
        </div>
      </StudentLayout>
    )
  }

  if (courseDetails === null) {
    return (
      <StudentLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <CourseNotFound />
        </div>
      </StudentLayout>
    )
  }

  const { course, pastLessons, upcomingLessons, allResources } = courseDetails

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowRightIcon className="h-4 w-4" />
                <span className="arabic-text">العودة للوحة التحكم</span>
              </Button>
            </Link>
          </div>

          {/* Course Header */}
          <CourseHeader course={course} />

          {/* Main Content Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Lessons Archive - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Lessons */}
              {upcomingLessons.length > 0 && (
                <UpcomingLessons lessons={upcomingLessons} />
              )}
              
              {/* Past Lessons Archive */}
              <LessonsArchive lessons={pastLessons} />
            </div>

            {/* Resource Library - Takes 1 column */}
            <div className="lg:col-span-1">
              <ResourceLibrary resources={allResources} />
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

function CourseHeader({ course }: { course: any }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="arabic-text text-2xl flex items-center gap-3">
              <BookOpenIcon className="h-6 w-6 text-primary" />
              {course.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span className="arabic-text">{course.instructor}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="arabic-text">
                  تاريخ الإنشاء: {new Date(course.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={course.isActive ? "default" : "secondary"} className="arabic-text">
            {course.isActive ? "نشط" : "غير نشط"}
          </Badge>
        </div>
      </CardHeader>
      {course.description && (
        <CardContent>
          <p className="arabic-text text-muted-foreground leading-relaxed">
            {course.description}
          </p>
        </CardContent>
      )}
    </Card>
  )
}

function UpcomingLessons({ lessons }: { lessons: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-text flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          الدروس القادمة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div key={lesson._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold arabic-text">{lesson.title}</h4>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground arabic-text mt-1">
                      {lesson.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="arabic-text">
                  قادم
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span className="arabic-text">
                    {new Date(lesson.scheduledTime).toLocaleString('ar-SA')}
                  </span>
                </div>
                {lesson.resources.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FileIcon className="h-4 w-4" />
                    <span className="arabic-text">
                      {lesson.resources.length} مورد
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LessonsArchive({ lessons }: { lessons: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-text flex items-center gap-2">
          <PlayCircleIcon className="h-5 w-5 text-primary" />
          أرشيف الدروس
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <PlayCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2">
              لا توجد دروس سابقة
            </h3>
            <p className="text-muted-foreground arabic-text">
              لم يتم إجراء أي دروس لهذه الدورة بعد.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold arabic-text">{lesson.title}</h4>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground arabic-text mt-1">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="arabic-text">
                    مكتمل
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span className="arabic-text">
                      {new Date(lesson.scheduledTime).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  {lesson.resources.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FileIcon className="h-4 w-4" />
                      <span className="arabic-text">
                        {lesson.resources.length} مورد
                      </span>
                    </div>
                  )}
                </div>

                {/* Recording Link */}
                {lesson.recordingUrl && (
                  <div className="pt-2">
                    <a 
                      href={lesson.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <PlayCircleIcon className="h-4 w-4" />
                      <span className="arabic-text">مشاهدة التسجيل</span>
                    </a>
                  </div>
                )}

                {/* Lesson Resources */}
                {lesson.resources.length > 0 && (
                  <div className="pt-2 border-t">
                    <h5 className="text-sm font-medium arabic-text mb-2">موارد الدرس:</h5>
                    <div className="space-y-2">
                      {lesson.resources.map((resource: any) => (
                        <ResourceItem key={resource._id} resource={resource} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResourceLibrary({ resources }: { resources: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="arabic-text flex items-center gap-2">
          <FileIcon className="h-5 w-5 text-primary" />
          مكتبة الموارد
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-8">
            <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2">
              لا توجد موارد
            </h3>
            <p className="text-muted-foreground arabic-text">
              لم يتم رفع أي موارد لهذه الدورة بعد.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <ResourceItem key={resource._id} resource={resource} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ResourceItem({ resource }: { resource: any }) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('document') || type.includes('word')) return '📝'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️'
    return '📁'
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">{getFileIcon(resource.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium arabic-text truncate">{resource.name}</p>
          <p className="text-xs text-muted-foreground arabic-text">
            {formatFileSize(resource.size)} • {new Date(resource.uploadedAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        asChild
        className="shrink-0"
      >
        <a
          href={resource.url}
          download={resource.name}
          className="flex items-center gap-1"
        >
          <DownloadIcon className="h-4 w-4" />
          <span className="arabic-text text-xs">تحميل</span>
        </a>
      </Button>
    </div>
  )
}

function CoursePageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Navigation Skeleton */}
      <Skeleton className="h-9 w-40" />
      
      {/* Course Header Skeleton */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>

      {/* Content Grid Skeleton */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="h-6 w-6" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function CourseNotFound() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRightIcon className="h-4 w-4" />
            <span className="arabic-text">العودة للوحة التحكم</span>
          </Button>
        </Link>
      </div>

      {/* Error Message */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircleIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2">
              الدورة غير موجودة
            </h3>
            <p className="text-muted-foreground arabic-text mb-4">
              لم يتم العثور على الدورة المطلوبة. قد تكون محذوفة أو غير متاحة.
            </p>
            <Link href="/dashboard">
              <Button className="arabic-text">
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}