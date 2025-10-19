"use client"

import { useState, useCallback, useMemo, startTransition } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModernCalendarGrid } from "@/components/admin/modern-calendar-grid"
import { UnifiedEventForm } from "@/components/admin/unified-event-form"
import {
    CalendarIcon,
    PlusIcon,
    BookOpenIcon,
    AlertTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Get current week start
function getCurrentWeekStart(): number {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    return startOfWeek.getTime()
}

// Calculate week end from start
function getWeekEnd(weekStart: number): number {
    return weekStart + (7 * 24 * 60 * 60 * 1000) - 1
}

export function ModernScheduleManagement() {
    const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [editingEventType, setEditingEventType] = useState<"lesson" | "meeting" | null>(null)
    const [showEventDialog, setShowEventDialog] = useState(false)

    const weekEnd = useMemo(() => getWeekEnd(currentWeekStart), [currentWeekStart])

    // Queries using the unified events API
    const unifiedEvents = useQuery(api.lessons.getUnifiedScheduleEvents, {
        startTime: currentWeekStart,
        endTime: weekEnd
    })

    const courses = useQuery(api.courses.getActiveCourses)

    // Mutations
    const deleteLesson = useMutation(api.lessons.deleteLesson)
    const deleteMeeting = useMutation(api.meetings.deleteMeeting)

    // Statistics calculation
    const stats = useMemo(() => {
        if (!unifiedEvents) return { totalEvents: 0, todaysEvents: 0, conflictingEvents: 0 }

        const today = new Date()
        const todayStr = today.toDateString()

        const todayCount = unifiedEvents.filter(event => {
            const eventDate = new Date(event.scheduledTime)
            return eventDate.toDateString() === todayStr
        }).length

        // Simple conflict detection - events within 1 hour of each other
        const conflictCount = unifiedEvents.filter(event => {
            return unifiedEvents.some(otherEvent =>
                otherEvent.id !== event.id &&
                Math.abs(otherEvent.scheduledTime - event.scheduledTime) < (60 * 60 * 1000)
            )
        }).length

        return {
            totalEvents: unifiedEvents.length,
            todaysEvents: todayCount,
            conflictingEvents: conflictCount
        }
    }, [unifiedEvents])

    // Navigation handlers
    const navigateWeek = useCallback((direction: 'prev' | 'next') => {
        startTransition(() => {
            const weekMs = 7 * 24 * 60 * 60 * 1000
            setCurrentWeekStart(prev =>
                direction === 'next' ? prev + weekMs : prev - weekMs
            )
        })
    }, [])

    const goToCurrentWeek = useCallback(() => {
        startTransition(() => {
            setCurrentWeekStart(getCurrentWeekStart())
        })
    }, [])

    // Event handlers
    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate(date)
        setEditingEventId(null)
        setEditingEventType(null)
        setShowEventDialog(true)
    }, [])

    const handleEditEvent = useCallback((eventId: string, eventType: "lesson" | "meeting") => {
        setEditingEventId(eventId)
        setEditingEventType(eventType)
        setSelectedDate(null)
        setShowEventDialog(true)
    }, [])

    const handleDeleteEvent = useCallback(async (eventId: string, eventType: "lesson" | "meeting") => {
        try {
            if (eventType === "lesson") {
                await deleteLesson({ id: eventId as Id<"lessons"> })
            } else {
                await deleteMeeting({ id: eventId as Id<"meetings"> })
            }
        } catch (error) {
            console.error("Error deleting event:", error)
        }
    }, [deleteLesson, deleteMeeting])

    const handleEventSuccess = useCallback(() => {
        setShowEventDialog(false)
        setSelectedDate(null)
        setEditingEventId(null)
        setEditingEventType(null)
    }, [])

    const handleDialogClose = useCallback(() => {
        setShowEventDialog(false)
        setSelectedDate(null)
        setEditingEventId(null)
        setEditingEventType(null)
    }, [])

    // Format current week display
    const currentWeekDate = new Date(currentWeekStart)
    const weekEndDate = new Date(weekEnd)
    const isCurrentWeek = getCurrentWeekStart() === currentWeekStart

    if (!unifiedEvents || !courses) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-4">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold arabic-text">الجدول الأسبوعي المحدث</h1>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 h-16 animate-pulse" />
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-1 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-16 bg-blue-100 dark:bg-blue-900 animate-pulse rounded" />
                            ))}
                        </div>
                        <div className="lg:col-span-3">
                            <div className="h-80 bg-blue-100 dark:bg-blue-900 animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
                {/* Simplified Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold arabic-text">الجدول الأسبوعي المحدث</h1>
                </div>

                {/* Navigation & CTA Row */}
                <div className="flex items-center justify-between bg-[#0f1729] rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateWeek('prev')}
                            className="bg-transparent border-blue-500/50 text-gray-300 hover:bg-blue-500/20 hover:border-blue-500 transition-colors"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                            <span className="arabic-text mr-1">السابق</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigateWeek('next')}
                            className="bg-transparent border-blue-500/50 text-gray-300 hover:bg-blue-500/20 hover:border-blue-500 transition-colors"
                        >
                            <span className="arabic-text ml-1">التالي</span>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={isCurrentWeek ? "default" : "outline"}
                            size="sm"
                            onClick={goToCurrentWeek}
                            className={cn(
                                "arabic-text transition-all duration-200",
                                isCurrentWeek 
                                    ? "bg-blue-600 hover:bg-blue-700 text-white border-0" 
                                    : "bg-transparent border-blue-500/50 text-gray-300 hover:bg-blue-500/20 hover:border-blue-500"
                            )}
                        >
                            الأسبوع الحالي
                        </Button>
                        <div className="text-sm text-gray-300 arabic-text font-medium mr-4 bg-transparent px-3 py-1 rounded-md border border-blue-500/30">
                            {currentWeekDate.toLocaleDateString('ar-SA', { 
                                day: 'numeric', 
                                month: 'long' 
                            })} - {weekEndDate.toLocaleDateString('ar-SA', { 
                                day: 'numeric', 
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                    <Button 
                        onClick={() => handleDateSelect(new Date())} 
                        className="arabic-text bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md transition-all duration-200"
                    >
                        <PlusIcon className="h-4 w-4 ml-2" />
                        إضافة حدث
                    </Button>
                </div>

                {/* Main Content: Stats + Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Compact Statistics */}
                    <div className="lg:col-span-1 space-y-2">
                        <Card className="transition-all duration-300 hover:shadow-md border-r-4 border-r-blue-500 bg-[#0f1729] border border-blue-500/30">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 border border-blue-500 rounded">
                                        <BookOpenIcon className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-400 arabic-text">
                                            أحداث الأسبوع
                                        </p>
                                        <p className="text-lg font-bold text-white">{stats.totalEvents}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="transition-all duration-300 hover:shadow-md border-r-4 border-r-green-500 bg-[#0f1729] border border-green-500/30">
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 border border-green-500 rounded">
                                        <CalendarIcon className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-400 arabic-text">
                                            أحداث اليوم
                                        </p>
                                        <p className="text-lg font-bold text-white">{stats.todaysEvents}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cn(
                            "transition-all duration-300 hover:shadow-md border-r-4 bg-[#0f1729]",
                            stats.conflictingEvents > 0 
                                ? "border-r-orange-500 border border-orange-500/30" 
                                : "border-r-gray-500 border border-gray-500/30"
                        )}>
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "p-1 border rounded",
                                        stats.conflictingEvents > 0
                                            ? "border-orange-500"
                                            : "border-gray-500"
                                    )}>
                                        <AlertTriangleIcon className={cn(
                                            "h-4 w-4",
                                            stats.conflictingEvents > 0
                                                ? "text-orange-500"
                                                : "text-gray-500"
                                        )} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-gray-400 arabic-text">
                                            تعارض المواعيد
                                        </p>
                                        <p className={cn(
                                            "text-lg font-bold",
                                            stats.conflictingEvents > 0
                                                ? "text-white"
                                                : "text-white"
                                        )}>
                                            {stats.conflictingEvents}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Calendar Grid */}
                    <div className="lg:col-span-3">
                        <ModernCalendarGrid
                            currentWeekStart={currentWeekStart}
                            events={unifiedEvents}
                            onDateSelect={handleDateSelect}
                            onEditEvent={handleEditEvent}
                            onDeleteEvent={handleDeleteEvent}
                        />
                    </div>
                </div>

                {/* Event Dialog */}
                <Dialog open={showEventDialog} onOpenChange={handleDialogClose}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir="rtl">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="arabic-text">
                                {editingEventId ? 'تعديل الحدث' : 'إضافة حدث جديد'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto p-6 pt-0">
                            <UnifiedEventForm
                                selectedDate={selectedDate}
                                editingEventId={editingEventId}
                                editingEventType={editingEventType}
                                courses={courses}
                                onSuccess={handleEventSuccess}
                                onCancel={handleDialogClose}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}