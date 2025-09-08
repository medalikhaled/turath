"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    BookOpenIcon,
    CalendarIcon,
    ClockIcon,
    AlertTriangleIcon,
    CheckIcon,
    XIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface LessonFormProps {
    lessonId?: Id<"lessons"> | null
    courses: Course[]
    selectedDate?: Date | null
    existingLessons: Lesson[]
    onSuccess: () => void
    onCancel: () => void
}

export function LessonForm({
    lessonId,
    courses,
    selectedDate,
    existingLessons,
    onSuccess,
    onCancel
}: LessonFormProps) {
    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [courseId, setCourseId] = React.useState<Id<"courses"> | "">("")
    const [scheduledDate, setScheduledDate] = React.useState("")
    const [scheduledTime, setScheduledTime] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    const existingLesson = useQuery(
        api.lessons.getLesson,
        lessonId ? { id: lessonId } : "skip"
    )

    const createLesson = useMutation(api.lessons.createLesson)
    const updateLesson = useMutation(api.lessons.updateLesson)

    // Initialize form with existing lesson data or selected date
    React.useEffect(() => {
        if (!isClient) return
        
        if (existingLesson) {
            setTitle(existingLesson.title)
            setDescription(existingLesson.description || "")
            setCourseId(existingLesson.courseId)
            
            const lessonDate = new Date(existingLesson.scheduledTime)
            setScheduledDate(lessonDate.toISOString().split('T')[0])
            setScheduledTime(lessonDate.toTimeString().slice(0, 5))
        } else if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0]
            const timeStr = selectedDate.toTimeString().slice(0, 5)
            setScheduledDate(dateStr)
            setScheduledTime(timeStr)
        }
    }, [existingLesson, selectedDate, isClient])

    const getScheduledDateTime = () => {
        if (!scheduledDate || !scheduledTime) return null
        const dateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        return dateTime.getTime()
    }

    const checkForConflicts = () => {
        const dateTime = getScheduledDateTime()
        if (!dateTime) return []

        return existingLessons.filter(lesson => {
            if (lessonId && lesson._id === lessonId) return false
            return Math.abs(lesson.scheduledTime - dateTime) < (60 * 60 * 1000) // Within 1 hour
        })
    }

    const conflicts = checkForConflicts()
    const hasConflicts = conflicts.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!title.trim() || !courseId || !scheduledDate || !scheduledTime) {
            return
        }

        const dateTime = getScheduledDateTime()
        if (!dateTime) return

        setIsSubmitting(true)

        try {
            if (lessonId) {
                await updateLesson({
                    id: lessonId,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    scheduledTime: dateTime,
                })
            } else {
                await createLesson({
                    courseId: courseId as Id<"courses">,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    scheduledTime: dateTime,
                })
            }
            onSuccess()
        } catch (error) {
            console.error("Error saving lesson:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedCourse = courses.find(course => course._id === courseId)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div className="space-y-2">
                <Label htmlFor="course" className="arabic-text flex items-center">
                    <BookOpenIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                    المادة الدراسية
                </Label>
                <Select value={courseId} onValueChange={(value) => setCourseId(value as Id<"courses">)} required>
                    <SelectTrigger id="course" dir="rtl">
                        <SelectValue placeholder="اختر المادة الدراسية" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                        {courses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                                <div className="text-right">
                                    <div className="font-medium arabic-text">{course.name}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">
                                        {course.instructor}
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedCourse && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm arabic-text">
                            <span className="font-medium">المدرس:</span> {selectedCourse.instructor}
                        </p>
                        <p className="text-sm text-muted-foreground arabic-text mt-1">
                            {selectedCourse.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Lesson Title */}
            <div className="space-y-2">
                <Label htmlFor="title" className="arabic-text">
                    عنوان الدرس
                </Label>
                <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="أدخل عنوان الدرس"
                    className="arabic-text"
                    dir="rtl"
                    required
                />
            </div>

            {/* Lesson Description */}
            <div className="space-y-2">
                <Label htmlFor="description" className="arabic-text">
                    وصف الدرس (اختياري)
                </Label>
                <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="أدخل وصف مختصر للدرس"
                    className="arabic-text"
                    dir="rtl"
                />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduledDate" className="arabic-text flex items-center">
                        <CalendarIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                        التاريخ
                    </Label>
                    <Input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="scheduledTime" className="arabic-text flex items-center">
                        <ClockIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                        الوقت
                    </Label>
                    <Input
                        id="scheduledTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* Conflict Warning */}
            {hasConflicts && (
                <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-orange-800 dark:text-orange-200 arabic-text flex items-center gap-2">
                            <AlertTriangleIcon className="h-5 w-5" />
                            تحذير: تعارض في المواعيد
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm text-orange-700 dark:text-orange-300 arabic-text mb-3">
                            يوجد دروس أخرى مجدولة في نفس الوقت تقريباً:
                        </p>
                        <div className="space-y-2">
                            {conflicts.map((conflict) => {
                                const conflictCourse = courses.find(c => c._id === conflict.courseId)
                                const conflictDate = new Date(conflict.scheduledTime)
                                return (
                                    <div key={conflict._id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/40 rounded">
                                        <div>
                                            <p className="font-medium text-sm arabic-text">{conflict.title}</p>
                                            <p className="text-xs text-muted-foreground arabic-text">
                                                {conflictCourse?.name}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {conflictDate.toLocaleTimeString('ar-SA', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !courseId || !scheduledDate || !scheduledTime}
                    className="flex-1 arabic-text"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {lessonId ? 'جاري التحديث...' : 'جاري الحفظ...'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CheckIcon className="h-4 w-4" />
                            {lessonId ? 'تحديث الدرس' : 'حفظ الدرس'}
                        </div>
                    )}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="arabic-text"
                >
                    <XIcon className="h-4 w-4 ml-2" />
                    إلغاء
                </Button>
            </div>
        </form>
    )
}