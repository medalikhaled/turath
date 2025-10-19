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
    LinkIcon,
    PlusIcon
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

interface CalendarGridViewProps {
    currentWeekStart: number
    onNavigateWeek: (direction: 'prev' | 'next') => void
    onGoToCurrentWeek: () => void
    onDateSelect?: (date: Date) => void
    onEditLesson?: (lessonId: Id<"lessons">) => void
    onEditMeeting?: (meetingId: Id<"meetings">) => void
    onDeleteLesson?: (lessonId: Id<"lessons">) => void
    onDeleteMeeting?: (meetingId: Id<"meetings">) => void
}

export function CalendarGridView({
    currentWeekStart,
    onNavigateWeek,
    onGoToCurrentWeek,
    onDateSelect,
    onEditLesson,
    onEditMeeting,
    onDeleteLesson,
    onDeleteMeeting
}: CalendarGridViewProps) {
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
                        <CardTitle className="arabic-text">التقويم الأسبوعي</CardTitle>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    const currentWeekDate = new Date(currentWeekStart)
    const endWeekDate = new Date(endOfWeek)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
        // Only allow clicking on today or future dates
        if (date >= today && onDateSelect) {
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
                    <CardTitle className="arabic-text">التقويم الأسبوعي</CardTitle>
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
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                    {dayNames.map((dayName, index) => (
                        <div key={index} className="text-center p-2 font-semibold text-sm arabic-text border-b">
                            {dayName}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const currentDay = new Date(currentWeekStart + (dayIndex * 24 * 60 * 60 * 1000))
                        const dayKey = currentDay.toISOString().split('T')[0]
                        const dayEvents = eventsByDay[dayKey] || []
                        const isToday = currentDay.toDateString() === new Date().toDateString()
                        const isPastDay = currentDay < today
                        const canClick = !isPastDay && onDateSelect

                        return (
                            <div
                                key={dayKey}
                                className={cn(
                                    "min-h-[120px] border rounded-lg p-2 transition-all duration-200",
                                    isToday ? "border-primary bg-primary/5" : "border-border",
                                    isPastDay ? "bg-muted/30 opacity-60" : "",
                                    canClick ? "cursor-pointer hover:border-primary/50 hover:bg-muted/50" : "",
                                    isPastDay ? "cursor-not-allowed" : ""
                                )}
                                onClick={() => handleDateClick(currentDay)}
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            isToday ? "text-primary" : isPastDay ? "text-muted-foreground" : ""
                                        )}>
                                            {currentDay.getDate()}
                                        </span>
                                        {isToday && (
                                            <Badge variant="default" className="text-xs arabic-text">
                                                اليوم
                                            </Badge>
                                        )}
                                    </div>
                                    {canClick && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDateClick(currentDay)
                                            }}
                                        >
                                            <PlusIcon className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>

                                {/* Events */}
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <div
                                            key={`${event.type}-${event.id}`}
                                            className={cn(
                                                "p-1 rounded text-xs transition-all duration-200 hover:shadow-sm group",
                                                event.type === "lesson" 
                                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                                    {event.type === "lesson" ? (
                                                        <BookOpenIcon className="h-3 w-3 flex-shrink-0" />
                                                    ) : (
                                                        <VideoIcon className="h-3 w-3 flex-shrink-0" />
                                                    )}
                                                    <span className="truncate font-medium">
                                                        {event.title}
                                                    </span>
                                                    {event.lesson?.meetingId && (
                                                        <LinkIcon className="h-2 w-2 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditEvent(event)
                                                        }}
                                                        className="h-4 w-4 p-0"
                                                    >
                                                        <EditIcon className="h-2 w-2" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteEvent(event)
                                                        }}
                                                        className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <TrashIcon className="h-2 w-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <ClockIcon className="h-2 w-2" />
                                                    <span>
                                                        {new Date(event.scheduledTime).toLocaleTimeString('ar-SA', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Show more indicator */}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-muted-foreground text-center p-1">
                                            +{dayEvents.length - 3} أخرى
                                        </div>
                                    )}
                                    
                                    {/* Empty state for clickable days */}
                                    {dayEvents.length === 0 && canClick && (
                                        <div className="text-center py-4 text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
                                            <PlusIcon className="h-4 w-4 mx-auto mb-1" />
                                            <p className="text-xs arabic-text">إضافة حدث</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}