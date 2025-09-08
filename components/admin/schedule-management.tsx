"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { WeeklyCalendar } from "./weekly-calendar"
import { LessonForm } from "./lesson-form"
import {
    CalendarIcon,
    PlusIcon,
    BookOpenIcon,
    ClockIcon,
    AlertTriangleIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ScheduleManagement() {
    const [currentWeekStart, setCurrentWeekStart] = React.useState<number | null>(null)
    const [isClient, setIsClient] = React.useState(false)

    // Initialize on client side to avoid hydration mismatch
    React.useEffect(() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - dayOfWeek)
        startOfWeek.setHours(0, 0, 0, 0)
        setCurrentWeekStart(startOfWeek.getTime())
        setIsClient(true)
    }, [])

    const [showCreateDialog, setShowCreateDialog] = React.useState(false)
    const [editingLesson, setEditingLesson] = React.useState<Id<"lessons"> | null>(null)
    const [deletingLesson, setDeletingLesson] = React.useState<Id<"lessons"> | null>(null)
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

    // Don't render until client-side hydration is complete
    if (!isClient || currentWeekStart === null) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold arabic-text">إدارة الجدول الأسبوعي</h1>
                        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                    <div className="h-96 bg-muted animate-pulse rounded" />
                </div>
            </div>
        )
    }

    const endOfWeek = currentWeekStart + (7 * 24 * 60 * 60 * 1000) - 1

    const weeklyLessons = useQuery(api.lessons.getWeeklySchedule, {
        startOfWeek: currentWeekStart,
        endOfWeek: endOfWeek
    })
    const courses = useQuery(api.courses.getActiveCourses)
    const deleteLesson = useMutation(api.lessons.deleteLesson)

    const handleCreateSuccess = () => {
        setShowCreateDialog(false)
        setSelectedDate(null)
    }

    const handleEditSuccess = () => {
        setEditingLesson(null)
    }

    const handleEdit = (lessonId: Id<"lessons">) => {
        setEditingLesson(lessonId)
        setShowCreateDialog(true)
    }

    const handleDelete = async () => {
        if (!deletingLesson) return

        try {
            await deleteLesson({ id: deletingLesson })
            setDeletingLesson(null)
        } catch (error) {
            console.error("Error deleting lesson:", error)
        }
    }

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setShowCreateDialog(true)
    }

    const navigateWeek = (direction: 'prev' | 'next') => {
        const weekMs = 7 * 24 * 60 * 60 * 1000
        setCurrentWeekStart(prev => {
            if (prev === null) return null
            return direction === 'next' ? prev + weekMs : prev - weekMs
        })
    }

    const goToCurrentWeek = () => {
        if (!isClient) return
        const now = new Date()
        const dayOfWeek = now.getDay()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - dayOfWeek)
        startOfWeek.setHours(0, 0, 0, 0)
        setCurrentWeekStart(startOfWeek.getTime())
    }

    if (!weeklyLessons || !courses) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold arabic-text">إدارة الجدول الأسبوعي</h1>
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Card>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const currentWeekDate = new Date(currentWeekStart)
    const endWeekDate = new Date(endOfWeek)

    const totalLessons = weeklyLessons.length
    const todaysLessons = weeklyLessons.filter(lesson => {
        const today = new Date()
        const lessonDate = new Date(lesson.scheduledTime)
        return lessonDate.toDateString() === today.toDateString()
    }).length

    const conflictingLessons = weeklyLessons.filter(lesson => {
        return weeklyLessons.some(otherLesson =>
            otherLesson._id !== lesson._id &&
            Math.abs(otherLesson.scheduledTime - lesson.scheduledTime) < (60 * 60 * 1000) // Within 1 hour
        )
    }).length

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold arabic-text">إدارة الجدول الأسبوعي</h1>
                        <p className="text-muted-foreground arabic-text">
                            جدولة وإدارة الدروس الأسبوعية
                        </p>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="arabic-text">
                                <PlusIcon className="h-4 w-4 ml-2" />
                                إضافة درس جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0" dir="rtl" showCloseButton={false}>
                            <DialogHeader className="px-8 py-6 border-b">
                                <DialogTitle className="arabic-text text-2xl font-bold text-right">
                                    {editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto px-8 py-6 max-h-[calc(90vh-140px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <LessonForm
                                    lessonId={editingLesson}
                                    courses={courses}
                                    selectedDate={selectedDate}
                                    existingLessons={weeklyLessons}
                                    onSuccess={editingLesson ? handleEditSuccess : handleCreateSuccess}
                                    onCancel={() => {
                                        setShowCreateDialog(false)
                                        setEditingLesson(null)
                                        setSelectedDate(null)
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-600 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 arabic-text transition-colors duration-300">دروس هذا الأسبوع</p>
                                    <p className="text-2xl font-bold group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300">{totalLessons}</p>
                                </div>
                                <div className="p-3 bg-muted/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 rounded-xl transition-all duration-300 group-hover:scale-110">
                                    <BookOpenIcon className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600 group">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 arabic-text transition-colors duration-300">دروس اليوم</p>
                                    <p className="text-2xl font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">{todaysLessons}</p>
                                </div>
                                <div className="p-3 bg-muted/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 rounded-xl transition-all duration-300 group-hover:scale-110">
                                    <CalendarIcon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn(
                        "cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 group",
                        conflictingLessons > 0
                            ? "border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500"
                            : "hover:border-green-300 dark:hover:border-green-600"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={cn(
                                        "text-sm font-medium transition-colors duration-300 arabic-text",
                                        conflictingLessons > 0
                                            ? "text-orange-600 dark:text-orange-400"
                                            : "text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400"
                                    )}>تعارض في المواعيد</p>
                                    <p className={cn(
                                        "text-2xl font-bold transition-colors duration-300",
                                        conflictingLessons > 0
                                            ? "text-orange-700 dark:text-orange-300"
                                            : "group-hover:text-green-700 dark:group-hover:text-green-300"
                                    )}>{conflictingLessons}</p>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                                    conflictingLessons > 0
                                        ? "bg-orange-100 dark:bg-orange-900/30"
                                        : "bg-muted/50 group-hover:bg-green-100 dark:group-hover:bg-green-900/30"
                                )}>
                                    <AlertTriangleIcon className={cn(
                                        "h-5 w-5 transition-colors duration-300",
                                        conflictingLessons > 0
                                            ? "text-orange-600 dark:text-orange-400"
                                            : "text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400"
                                    )} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Weekly Calendar */}
                <WeeklyCalendar
                    currentWeekStart={currentWeekStart}
                    lessons={weeklyLessons}
                    courses={courses}
                    onNavigateWeek={navigateWeek}
                    onGoToCurrentWeek={goToCurrentWeek}
                    onDateSelect={handleDateSelect}
                    onEditLesson={handleEdit}
                    onDeleteLesson={setDeletingLesson}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deletingLesson} onOpenChange={() => setDeletingLesson(null)}>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="arabic-text">تأكيد حذف الدرس</AlertDialogTitle>
                            <AlertDialogDescription className="arabic-text">
                                هل أنت متأكد من حذف هذا الدرس؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="arabic-text">إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 arabic-text"
                            >
                                حذف الدرس
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}