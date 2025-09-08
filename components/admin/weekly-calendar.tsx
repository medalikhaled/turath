"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    CalendarIcon,
    ClockIcon,
    BookOpenIcon,
    EditIcon,
    TrashIcon,
    PlusIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Id } from "@/convex/_generated/dataModel"

interface Lesson {
    _id: Id<"lessons">
    courseId: Id<"courses">
    title: string
    description?: string
    scheduledTime: number
    recordingUrl?: string
    resources: Id<"files">[]
    meetingId?: Id<"meetings">
}

interface Course {
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
}

interface WeeklyCalendarProps {
    currentWeekStart: number
    lessons: Lesson[]
    courses: Course[]
    onNavigateWeek: (direction: 'prev' | 'next') => void
    onGoToCurrentWeek: () => void
    onDateSelect: (date: Date) => void
    onEditLesson: (lessonId: Id<"lessons">) => void
    onDeleteLesson: (lessonId: Id<"lessons">) => void
}

const DAYS_OF_WEEK = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
]

const TIME_SLOTS = [
    { hour: 8, label: '8:00 ص' },
    { hour: 9, label: '9:00 ص' },
    { hour: 10, label: '10:00 ص' },
    { hour: 11, label: '11:00 ص' },
    { hour: 12, label: '12:00 م' },
    { hour: 13, label: '1:00 م' },
    { hour: 14, label: '2:00 م' },
    { hour: 15, label: '3:00 م' },
    { hour: 16, label: '4:00 م' },
    { hour: 17, label: '5:00 م' },
    { hour: 18, label: '6:00 م' },
    { hour: 19, label: '7:00 م' },
    { hour: 20, label: '8:00 م' },
    { hour: 21, label: '9:00 م' },
]

export function WeeklyCalendar({
    currentWeekStart,
    lessons,
    courses,
    onNavigateWeek,
    onGoToCurrentWeek,
    onDateSelect,
    onEditLesson,
    onDeleteLesson
}: WeeklyCalendarProps) {
    const currentWeekDate = new Date(currentWeekStart)
    const endWeekDate = new Date(currentWeekStart + (6 * 24 * 60 * 60 * 1000))
    
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    const isCurrentWeek = () => {
        if (!isClient) return false
        const now = new Date()
        const nowWeekStart = new Date(now)
        const dayOfWeek = now.getDay()
        nowWeekStart.setDate(now.getDate() - dayOfWeek)
        nowWeekStart.setHours(0, 0, 0, 0)
        return Math.abs(nowWeekStart.getTime() - currentWeekStart) < 24 * 60 * 60 * 1000
    }

    const formatDateRange = () => {
        const startMonth = currentWeekDate.toLocaleDateString('ar-SA', { month: 'long' })
        const endMonth = endWeekDate.toLocaleDateString('ar-SA', { month: 'long' })
        const year = currentWeekDate.getFullYear()
        
        if (startMonth === endMonth) {
            return `${startMonth} ${year}`
        } else {
            return `${startMonth} - ${endMonth} ${year}`
        }
    }

    const getDayLessons = (dayIndex: number) => {
        const dayStart = new Date(currentWeekStart + (dayIndex * 24 * 60 * 60 * 1000))
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)
        
        return lessons.filter(lesson => {
            const lessonDate = new Date(lesson.scheduledTime)
            return lessonDate >= dayStart && lessonDate <= dayEnd
        }).sort((a, b) => a.scheduledTime - b.scheduledTime)
    }

    const getLessonAtTimeSlot = (dayIndex: number, hour: number) => {
        const dayLessons = getDayLessons(dayIndex)
        return dayLessons.find(lesson => {
            const lessonDate = new Date(lesson.scheduledTime)
            return lessonDate.getHours() === hour
        })
    }

    const hasConflict = (lesson: Lesson) => {
        return lessons.some(otherLesson => 
            otherLesson._id !== lesson._id &&
            Math.abs(otherLesson.scheduledTime - lesson.scheduledTime) < (60 * 60 * 1000)
        )
    }

    const getCourseForLesson = (lesson: Lesson) => {
        return courses.find(course => course._id === lesson.courseId)
    }

    const handleTimeSlotClick = (dayIndex: number, hour: number) => {
        const clickedDate = new Date(currentWeekStart + (dayIndex * 24 * 60 * 60 * 1000))
        clickedDate.setHours(hour, 0, 0, 0)
        onDateSelect(clickedDate)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="arabic-text flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            الجدول الأسبوعي
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigateWeek('prev')}
                                className="arabic-text"
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onGoToCurrentWeek}
                                disabled={isCurrentWeek()}
                                className="arabic-text"
                            >
                                الأسبوع الحالي
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigateWeek('next')}
                                className="arabic-text"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold arabic-text">{formatDateRange()}</p>
                        <p className="text-sm text-muted-foreground arabic-text">
                            {currentWeekDate.getDate()} - {endWeekDate.getDate()}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Header with days */}
                        <div className="grid grid-cols-8 gap-2 mb-4">
                            <div className="p-2"></div> {/* Empty cell for time column */}
                            {DAYS_OF_WEEK.map((day, index) => {
                                const dayDate = new Date(currentWeekStart + (index * 24 * 60 * 60 * 1000))
                                const isToday = isClient ? new Date().toDateString() === dayDate.toDateString() : false
                                const dayLessons = getDayLessons(index)
                                
                                return (
                                    <div key={day} className={cn(
                                        "p-3 text-center rounded-lg border",
                                        isToday ? "bg-primary text-primary-foreground" : "bg-muted/50"
                                    )}>
                                        <div className="font-semibold arabic-text">{day}</div>
                                        <div className="text-sm opacity-80">
                                            {dayDate.getDate()}
                                        </div>
                                        {dayLessons.length > 0 && (
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                {dayLessons.length} درس
                                            </Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Time slots grid */}
                        <div className="space-y-1">
                            {TIME_SLOTS.map(({ hour, label }) => (
                                <div key={hour} className="grid grid-cols-8 gap-2">
                                    {/* Time label */}
                                    <div className="p-2 text-sm text-muted-foreground text-center font-medium">
                                        {label}
                                    </div>
                                    
                                    {/* Day cells */}
                                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                                        const lesson = getLessonAtTimeSlot(dayIndex, hour)
                                        const course = lesson ? getCourseForLesson(lesson) : null
                                        const hasConflictFlag = lesson ? hasConflict(lesson) : false
                                        
                                        return (
                                            <div
                                                key={dayIndex}
                                                className={cn(
                                                    "min-h-[60px] p-2 border rounded-lg transition-all duration-200 cursor-pointer",
                                                    lesson 
                                                        ? hasConflictFlag
                                                            ? "bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/30"
                                                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                                        : "bg-muted/30 hover:bg-muted/50 border-dashed"
                                                )}
                                                onClick={() => {
                                                    if (lesson) {
                                                        onEditLesson(lesson._id)
                                                    } else {
                                                        handleTimeSlotClick(dayIndex, hour)
                                                    }
                                                }}
                                            >
                                                {lesson ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate arabic-text">
                                                                    {lesson.title}
                                                                </p>
                                                                {course && (
                                                                    <p className="text-xs text-muted-foreground truncate arabic-text">
                                                                        {course.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 ml-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onEditLesson(lesson._id)
                                                                    }}
                                                                >
                                                                    <EditIcon className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-red-200 dark:hover:bg-red-800"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onDeleteLesson(lesson._id)
                                                                    }}
                                                                >
                                                                    <TrashIcon className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <ClockIcon className="h-3 w-3" />
                                                            <span>
                                                                {new Date(lesson.scheduledTime).toLocaleTimeString('ar-SA', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        {hasConflictFlag && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                تعارض
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                                        <PlusIcon className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}