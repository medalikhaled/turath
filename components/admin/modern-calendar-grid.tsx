"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    BookOpenIcon,
    VideoIcon,
    MoreVerticalIcon,
    EditIcon,
    TrashIcon,
    ClockIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UnifiedEvent {
    id: string
    type: "lesson" | "meeting"
    title: string
    description?: string
    scheduledTime: number
    courseId: string
    course: { name: string } | null
}

interface ModernCalendarGridProps {
    currentWeekStart: number
    events: UnifiedEvent[]
    onDateSelect: (date: Date) => void
    onEditEvent: (eventId: string, eventType: "lesson" | "meeting") => void
    onDeleteEvent: (eventId: string, eventType: "lesson" | "meeting") => void
}

export function ModernCalendarGrid({
    currentWeekStart,
    events,
    onDateSelect,
    onEditEvent,
    onDeleteEvent
}: ModernCalendarGridProps) {

    // Generate week days
    const weekDays = useMemo(() => {
        const days = []
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart + (i * 24 * 60 * 60 * 1000))
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.scheduledTime)
                return eventDate.toDateString() === date.toDateString()
            })

            days.push({
                date,
                dayName: dayNames[i],
                events: dayEvents.sort((a, b) => a.scheduledTime - b.scheduledTime),
                isToday: date.toDateString() === new Date().toDateString(),
                isPast: date < new Date(new Date().setHours(0, 0, 0, 0))
            })
        }

        return days
    }, [currentWeekStart, events])

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const handleDateClick = (date: Date, isPast: boolean) => {
        if (!isPast) {
            onDateSelect(date)
        }
    }

    return (
        <Card className="overflow-hidden shadow-sm bg-[#0f1729] border border-blue-500/30">
            <CardContent className="p-0 bg-transparent">
                <div className="grid grid-cols-7 border-b border-blue-500/30 bg-transparent">
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            className={cn(
                                "p-3 text-center border-r border-blue-500/30 transition-all duration-200",
                                index === 6 && "border-r-0",
                                day.isToday && "bg-blue-500/10 border-b-2 border-b-blue-500"
                            )}
                        >
                            <div className="font-medium text-sm arabic-text text-gray-400">{day.dayName}</div>
                            <div className={cn(
                                "text-lg font-bold mt-1 transition-colors duration-200 text-white",
                                day.isToday && "text-blue-400"
                            )}>
                                {day.date.getDate()}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 min-h-[250px] bg-transparent">
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            className={cn(
                                "border-r border-blue-500/30 p-3 transition-all duration-200 relative min-h-[230px]",
                                index === 6 && "border-r-0",
                                day.isPast
                                    ? "cursor-not-allowed opacity-30"
                                    : "cursor-pointer hover:bg-blue-500/5 hover:shadow-sm bg-transparent",
                                day.isToday && "bg-blue-500/10 border-r-2 border-r-blue-500"
                            )}
                            onClick={() => handleDateClick(day.date, day.isPast)}
                        >
                            <div className="space-y-1">
                                {day.events.map((event) => (
                                    <div
                                        key={event.id}
                                        className={cn(
                                            "p-2 rounded-md text-xs transition-all duration-200 hover:shadow-md hover:scale-[1.01] border-r-4 mb-2 bg-[#1a2332]",
                                            event.type === "lesson"
                                                ? "border-r-blue-500 border border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
                                                : "border-r-green-500 border border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50",
                                            day.isPast && "opacity-60"
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                {event.type === "lesson" ? (
                                                    <BookOpenIcon className="h-3 w-3 flex-shrink-0" />
                                                ) : (
                                                    <VideoIcon className="h-3 w-3 flex-shrink-0" />
                                                )}
                                                <span className="font-medium truncate arabic-text text-white">
                                                    {event.title}
                                                </span>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 hover:bg-white/10 text-white"
                                                    >
                                                        <MoreVerticalIcon className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => onEditEvent(event.id, event.type)}
                                                        className="arabic-text"
                                                    >
                                                        <EditIcon className="h-4 w-4 ml-2" />
                                                        تعديل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteEvent(event.id, event.type)}
                                                        className="text-red-600 arabic-text"
                                                    >
                                                        <TrashIcon className="h-4 w-4 ml-2" />
                                                        حذف
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <ClockIcon className="h-3 w-3" />
                                                {formatTime(event.scheduledTime)}
                                            </div>

                                            {event.course && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs px-1 py-0 arabic-text"
                                                >
                                                    {event.course.name}
                                                </Badge>
                                            )}
                                        </div>

                                        {event.description && (
                                            <div className="text-xs text-white mt-1 truncate arabic-text">
                                                {event.description}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {day.events.length === 0 && (
                                    <div className={cn(
                                        "text-center py-8 text-xs arabic-text transition-all duration-200 text-gray-500",
                                        !day.isPast && "hover:text-gray-400"
                                    )}>
                                        {day.isPast ? "لا توجد أحداث" : "انقر لإضافة حدث"}
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