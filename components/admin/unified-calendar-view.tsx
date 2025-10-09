"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    BookOpenIcon,
    VideoIcon,
    CalendarIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    EditIcon,
    TrashIcon,
    LinkIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Course {
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
}

interface UnifiedEvent {
    id: Id<"lessons"> | Id<"meetings">
    type: "lesson" | "meeting"
    title: string
    description?: string
    scheduledTime: number
    courseId: Id<"courses">
    course: Course | null
    lesson: any | null
    meeting: any | null
}

interface UnifiedCalendarViewProps {
    currentWeekStart: number
    onNavigateWeek: (direction: 'prev' | 'next') => void
    onGoToCurrentWeek: () => void
    onDateSelect?: (date: Date) => void
    onEditLesson?: (lessonId: Id<"lessons">) => void
    onEditMeeting?: (meetingId: Id<"meetings">) => void
    onDeleteLesson?: (lessonId: Id<"lessons">) => void
    onDeleteMeeting?: (meetingId: Id<"meetings">) => void
}

export function UnifiedCalendarView({
    currentWeekStart,
    onNavigateWeek,
    onGoToCurrentWeek,
    onDateSelect,
    onEditLesson,
    onEditMeeting,
    onDeleteLesson,
    onDeleteMeeting
}: UnifiedCalendarViewProps) {
    const endOfWeek = currentWeekStart + (7 * 24 * 60 * 60 * 1000) - 1

    // Fetch unified events for the week
    const unifiedEvents = useQuery(api.lessons.getUnifiedScheduleEvents, {
        startTime: currentWeekStart,
        endTime: endOfWeek
    })

    if (!unifiedEvents) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="arabic-text">الجدول الموحد</CardTitle>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const currentWeekDate = new Date(currentWeekStart)
    const endWeekDate = new Date(endOfWeek)

    // Group events by day
    const eventsByDay = React.useMemo(() => {
        const days: { [key: string]: UnifiedEvent[] } = {}
        
        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(currentWeekStart + (i * 24 * 60 * 60 * 1000))
            const dayKey = dayStart.toISOString().split('T')[0]
            days[dayKey] = []
        }

        unifiedEvents.forEach(event => {
            const eventDate = new Date(event.scheduledTime)
            const dayKey = eventDate.toISOString().split('T')[0]
            if (days[dayKey]) {
                days[dayKey].push(event)
            }
        })

        // Sort events within each day by time
        Object.keys(days).forEach(dayKey => {
            days[dayKey].sort((a, b) => a.scheduledTime - b.scheduledTime)
        })

        return days
    }, [unifiedEvents, currentWeekStart])

    const handleDateClick = (date: Date) => {
        if (onDateSelect) {
            onDateSelect(date)
        }
    }

    const handleEditEvent = (event: UnifiedEvent) => {
        if (event.type === "lesson" && onEditLesson) {
            onEditLesson(event.id as Id<"lessons">)
        } else if (event.type === "meeting" && onEditMeeting) {
            onEditMeeting(event.id as Id<"meetings">)
        }
    }

    const handleDeleteEvent = (event: UnifiedEvent) => {
        if (event.type === "lesson" && onDeleteLesson) {
            onDeleteLesson(event.id as Id<"lessons">)
        } else if (event.type === "meeting" && onDeleteMeeting) {
            onDeleteMeeting(event.id as Id<"meetings">)
        }
    }

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="arabic-text">الجدول الموحد - الدروس والجلسات</CardTitle>
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
                            className="arabic-text"
                        >
                            <HomeIcon className="h-4 w-4 ml-1" />
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
                <p className="text-sm text-muted-foreground arabic-text">
                    {currentWeekDate.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })} - {endWeekDate.toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const currentDay = new Date(currentWeekStart + (dayIndex * 24 * 60 * 60 * 1000))
                        const dayKey = currentDay.toISOString().split('T')[0]
                        const dayEvents = eventsByDay[dayKey] || []
                        const isToday = currentDay.toDateString() === new Date().toDateString()

                        return (
                            <div
                                key={dayKey}
                                className={cn(
                                    "border rounded-lg p-4 transition-all duration-200",
                                    isToday ? "border-primary bg-primary/5" : "border-border",
                                    onDateSelect ? "cursor-pointer hover:border-primary/50 hover:bg-muted/50" : ""
                                )}
                                onClick={() => handleDateClick(currentDay)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className={cn(
                                            "font-semibold arabic-text",
                                            isToday ? "text-primary" : ""
                                        )}>
                                            {dayNames[dayIndex]}
                                        </h3>
                                        <span className={cn(
                                            "text-sm",
                                            isToday ? "text-primary font-medium" : "text-muted-foreground"
                                        )}>
                                            {currentDay.toLocaleDateString('ar-SA', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        {isToday && (
                                            <Badge variant="default" className="text-xs arabic-text">
                                                اليوم
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Badge variant="outline" className="text-xs">
                                            {dayEvents.length}
                                        </Badge>
                                    </div>
                                </div>

                                {dayEvents.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm arabic-text">لا توجد أحداث مجدولة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {dayEvents.map((event) => (
                                            <div
                                                key={`${event.type}-${event.id}`}
                                                className={cn(
                                                    "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                                                    event.type === "lesson" 
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                        : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {event.type === "lesson" ? (
                                                                <BookOpenIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                                            ) : (
                                                                <VideoIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                                            )}
                                                            <h4 className="font-medium text-sm arabic-text truncate">
                                                                {event.title}
                                                            </h4>
                                                            {event.lesson?.meetingId && (
                                                                <LinkIcon className="h-3 w-3 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <ClockIcon className="h-3 w-3" />
                                                                {new Date(event.scheduledTime).toLocaleTimeString('ar-SA', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                            <div className="arabic-text truncate">
                                                                {event.course?.name || 'غير محدد'}
                                                            </div>
                                                        </div>
                                                        {event.description && (
                                                            <p className="text-xs text-muted-foreground mt-1 arabic-text line-clamp-1">
                                                                {event.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleEditEvent(event)
                                                            }}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <EditIcon className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteEvent(event)
                                                            }}
                                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            <TrashIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}