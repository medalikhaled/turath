"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LessonForm } from "./lesson-form"
import { MeetingForm } from "./meeting-form"
import { 
    BookOpenIcon,
    VideoIcon,
    CalendarIcon,
    ClockIcon
} from "lucide-react"

interface Course {
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
}

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

interface UnifiedSchedulingFormProps {
    selectedDate?: Date | null
    editingLessonId?: Id<"lessons"> | null
    editingMeetingId?: Id<"meetings"> | null
    onSuccess: () => void
    onCancel: () => void
}

export function UnifiedSchedulingForm({
    selectedDate,
    editingLessonId,
    editingMeetingId,
    onSuccess,
    onCancel
}: UnifiedSchedulingFormProps) {
    const [activeTab, setActiveTab] = React.useState<"lesson" | "meeting">("lesson")

    // Fetch required data
    const courses = useQuery(api.courses.getActiveCourses) || []
    const lessons = useQuery(api.lessons.getLessonsWithCourses, {
        startTime: Date.now() - (30 * 24 * 60 * 60 * 1000), // Last 30 days
        endTime: Date.now() + (90 * 24 * 60 * 60 * 1000), // Next 90 days
    }) || []

    // Set initial tab based on what's being edited
    React.useEffect(() => {
        if (editingLessonId) {
            setActiveTab("lesson")
        } else if (editingMeetingId) {
            setActiveTab("meeting")
        }
    }, [editingLessonId, editingMeetingId])

    const activeCourses = React.useMemo(() => 
        courses.filter((course: any) => course.isActive), 
        [courses]
    )
    
    const existingLessons = React.useMemo(() => 
        lessons.map((lesson: any) => ({
            _id: lesson._id,
            courseId: lesson.courseId,
            title: lesson.title,
            description: lesson.description,
            scheduledTime: lesson.scheduledTime,
            recordingUrl: lesson.recordingUrl,
            resources: lesson.resources,
            meetingId: lesson.meetingId,
        })), 
        [lessons]
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold arabic-text">
                    {editingLessonId || editingMeetingId ? 'تعديل الحدث' : 'إنشاء حدث جديد'}
                </h2>
                <p className="text-muted-foreground arabic-text">
                    {selectedDate && (
                        <>
                            التاريخ المحدد: {selectedDate.toLocaleDateString('ar-SA', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </>
                    )}
                </p>
            </div>

            {/* Unified Scheduling Tabs */}
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "lesson" | "meeting")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lesson" className="arabic-text flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4" />
                        درس
                    </TabsTrigger>
                    <TabsTrigger value="meeting" className="arabic-text flex items-center gap-2">
                        <VideoIcon className="h-4 w-4" />
                        جلسة
                    </TabsTrigger>
                </TabsList>

                {/* Lesson Creation Tab */}
                <TabsContent value="lesson" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="arabic-text flex items-center gap-2">
                                <BookOpenIcon className="h-5 w-5" />
                                {editingLessonId ? 'تعديل الدرس' : 'إنشاء درس جديد'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground arabic-text">
                                يمكنك إنشاء درس مع إمكانية ربطه بجلسة Google Meet تلقائياً
                            </p>
                        </CardHeader>
                        <CardContent>
                            <LessonForm
                                lessonId={editingLessonId}
                                courses={activeCourses}
                                selectedDate={selectedDate}
                                existingLessons={existingLessons}
                                onSuccess={onSuccess}
                                onCancel={onCancel}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Meeting Creation Tab */}
                <TabsContent value="meeting" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="arabic-text flex items-center gap-2">
                                <VideoIcon className="h-5 w-5" />
                                {editingMeetingId ? 'تعديل الجلسة' : 'إنشاء جلسة جديدة'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground arabic-text">
                                إنشاء جلسة Google Meet منفصلة أو ربطها بدرس موجود
                            </p>
                        </CardHeader>
                        <CardContent>
                            <MeetingForm
                                meetingId={editingMeetingId}
                                courses={activeCourses}
                                onSuccess={onSuccess}
                                onCancel={onCancel}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 arabic-text">
                                    المقررات النشطة
                                </p>
                                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {activeCourses.length}
                                </p>
                            </div>
                            <BookOpenIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800 dark:text-green-200 arabic-text">
                                    الدروس المجدولة
                                </p>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {existingLessons.filter(lesson => lesson.scheduledTime > Date.now()).length}
                                </p>
                            </div>
                            <CalendarIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-800 dark:text-purple-200 arabic-text">
                                    الدروس المرتبطة بجلسات
                                </p>
                                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {existingLessons.filter(lesson => lesson.meetingId).length}
                                </p>
                            </div>
                            <VideoIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}