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
    XIcon,
    VideoIcon,
    LinkIcon,
    KeyIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
    validateSchedule, 
    ScheduleValidationResult,
    detectTimeConflicts 
} from "@/lib/schedule-validation"
import { Switch } from "@/components/ui/switch"

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
    const [validationResult, setValidationResult] = React.useState<ScheduleValidationResult>({
        isValid: true,
        errors: [],
        warnings: []
    })

    // Meeting integration state
    const [autoCreateMeeting, setAutoCreateMeeting] = React.useState(false)
    const [meetingLink, setMeetingLink] = React.useState("")
    const [meetingPassword, setMeetingPassword] = React.useState("")
    const [meetingDuration, setMeetingDuration] = React.useState(60)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    const existingLesson = useQuery(
        api.lessons.getLesson,
        lessonId ? { id: lessonId } : "skip"
    )

    const createLesson = useMutation(api.lessons.createLesson)
    const createLessonWithMeeting = useMutation(api.lessons.createLessonWithMeeting)
    const updateLesson = useMutation(api.lessons.updateLesson)
    const createMeeting = useMutation(api.meetings.createMeeting)

    // Google Meet link validation helper
    const validateGoogleMeetLink = React.useCallback((link: string): { isValid: boolean; formatted?: string; error?: string } => {
        if (!link.trim()) {
            return { isValid: false, error: 'رابط Google Meet مطلوب عند تفعيل إنشاء الجلسة' }
        }

        const cleanLink = link.trim()
        const meetPatterns = [
            /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
            /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/,
            /^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
            /^meet\.google\.com\/[a-z0-9-]+$/,
            /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
            /^[a-z0-9-]+$/
        ]

        let formattedLink = cleanLink
        if (!formattedLink.startsWith('https://')) {
            if (formattedLink.startsWith('meet.google.com/')) {
                formattedLink = 'https://' + formattedLink
            } else if (meetPatterns.some(pattern => pattern.test(formattedLink))) {
                formattedLink = 'https://meet.google.com/' + formattedLink
            }
        }

        const isValidFormat = meetPatterns.some(pattern => {
            if (pattern.source.includes('https://')) {
                return pattern.test(formattedLink)
            } else {
                return pattern.test(formattedLink.replace('https://meet.google.com/', ''))
            }
        })

        if (!isValidFormat) {
            return { 
                isValid: false, 
                error: 'تنسيق رابط Google Meet غير صحيح. مثال: https://meet.google.com/abc-defg-hij' 
            }
        }

        return { isValid: true, formatted: formattedLink }
    }, [])

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

            // If lesson has an associated meeting, enable auto-create and load meeting data
            if (existingLesson.meetingId) {
                setAutoCreateMeeting(true)
                // Note: We would need to fetch meeting data here, but for now we'll just enable the toggle
            }
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

    // Memoize the lesson data to prevent unnecessary re-renders
    const lessonData = React.useMemo(() => 
        existingLessons.map(lesson => ({
            _id: lesson._id,
            scheduledTime: lesson.scheduledTime,
            title: lesson.title
        })), [existingLessons]
    )

    // Real-time validation effect
    React.useEffect(() => {
        if (!scheduledDate || !scheduledTime) {
            setValidationResult({
                isValid: true,
                errors: [],
                warnings: []
            })
            return
        }

        const result = validateSchedule(
            scheduledDate,
            scheduledTime,
            lessonData,
            lessonId || undefined
        )

        setValidationResult(result)
    }, [scheduledDate, scheduledTime, lessonData, lessonId])

    const checkForConflicts = React.useCallback(() => {
        const dateTime = getScheduledDateTime()
        if (!dateTime) return []

        return detectTimeConflicts(
            dateTime,
            lessonData,
            lessonId || undefined
        ).map(conflict => {
            // Find the original lesson to get the courseId
            const originalLesson = existingLessons.find(lesson => lesson._id === conflict._id)
            return {
                ...conflict,
                courseId: originalLesson?.courseId
            }
        })
    }, [lessonData, lessonId, existingLessons, scheduledDate, scheduledTime])

    const conflicts = React.useMemo(() => checkForConflicts(), [checkForConflicts])
    const hasConflicts = conflicts.length > 0
    const hasValidationErrors = validationResult.errors.length > 0
    const hasValidationWarnings = validationResult.warnings.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!title.trim() || !courseId || !scheduledDate || !scheduledTime) {
            return
        }

        // Prevent submission if there are validation errors
        if (hasValidationErrors) {
            return
        }

        // Validate meeting fields if auto-create is enabled
        if (autoCreateMeeting) {
            const linkValidation = validateGoogleMeetLink(meetingLink)
            if (!linkValidation.isValid) {
                return
            }
        }

        const dateTime = getScheduledDateTime()
        if (!dateTime) return

        setIsSubmitting(true)

        try {
            if (lessonId) {
                // Update existing lesson
                await updateLesson({
                    id: lessonId,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    scheduledTime: dateTime,
                })
            } else {
                // Create new lesson with optional meeting
                if (autoCreateMeeting) {
                    const linkValidation = validateGoogleMeetLink(meetingLink)
                    if (linkValidation.isValid && linkValidation.formatted) {
                        await createLessonWithMeeting({
                            courseId: courseId as Id<"courses">,
                            title: title.trim(),
                            description: description.trim() || undefined,
                            scheduledTime: dateTime,
                            createMeeting: true,
                            meetingData: {
                                googleMeetLink: linkValidation.formatted,
                                password: meetingPassword || undefined,
                                duration: meetingDuration,
                            },
                        })
                    }
                } else {
                    // Create lesson without meeting
                    await createLesson({
                        courseId: courseId as Id<"courses">,
                        title: title.trim(),
                        description: description.trim() || undefined,
                        scheduledTime: dateTime,
                    })
                }
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

            {/* Meeting Integration Toggle */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="arabic-text flex items-center">
                            <VideoIcon className="h-4 w-4 ml-1" />
                            إنشاء جلسة مرتبطة
                        </Label>
                        <p className="text-sm text-muted-foreground arabic-text">
                            إنشاء جلسة Google Meet تلقائياً مع هذا الدرس
                        </p>
                    </div>
                    <Switch
                        checked={autoCreateMeeting}
                        onCheckedChange={setAutoCreateMeeting}
                        disabled={!!lessonId} // Disable for existing lessons for now
                    />
                </div>

                {/* Meeting Fields - Show when toggle is enabled */}
                {autoCreateMeeting && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* Google Meet Link */}
                        <div className="space-y-2">
                            <Label htmlFor="meetingLink" className="arabic-text flex items-center">
                                <LinkIcon className="h-4 w-4 ml-1" />
                                رابط Google Meet
                            </Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                className="text-left"
                                dir="ltr"
                                required={autoCreateMeeting}
                            />
                            <p className="text-xs text-muted-foreground arabic-text">
                                أدخل رابط Google Meet للجلسة
                            </p>
                        </div>

                        {/* Meeting Password */}
                        <div className="space-y-2">
                            <Label htmlFor="meetingPassword" className="arabic-text flex items-center">
                                <KeyIcon className="h-4 w-4 ml-1" />
                                كلمة مرور الجلسة (اختيارية)
                            </Label>
                            <Input
                                id="meetingPassword"
                                type="text"
                                value={meetingPassword}
                                onChange={(e) => setMeetingPassword(e.target.value)}
                                placeholder="كلمة مرور الجلسة"
                                className="arabic-text"
                                dir="rtl"
                            />
                        </div>

                        {/* Meeting Duration */}
                        <div className="space-y-2">
                            <Label htmlFor="meetingDuration" className="arabic-text flex items-center">
                                <ClockIcon className="h-4 w-4 ml-1" />
                                مدة الجلسة (بالدقائق)
                            </Label>
                            <Select
                                value={meetingDuration.toString()}
                                onValueChange={(value) => setMeetingDuration(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="30">30 دقيقة</SelectItem>
                                    <SelectItem value="45">45 دقيقة</SelectItem>
                                    <SelectItem value="60">ساعة واحدة</SelectItem>
                                    <SelectItem value="90">ساعة ونصف</SelectItem>
                                    <SelectItem value="120">ساعتان</SelectItem>
                                    <SelectItem value="180">3 ساعات</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
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
                        className={cn(
                            hasValidationErrors && validationResult.errors.some(e => e.field === 'scheduledDate' || e.field === 'scheduledDateTime') 
                                ? "border-red-500 focus:border-red-500" 
                                : ""
                        )}
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
                        className={cn(
                            hasValidationErrors && validationResult.errors.some(e => e.field === 'scheduledTime' || e.field === 'scheduledDateTime') 
                                ? "border-red-500 focus:border-red-500" 
                                : ""
                        )}
                        required
                    />
                </div>
            </div>

            {/* Validation Errors */}
            {hasValidationErrors && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-800 dark:text-red-200 arabic-text flex items-center gap-2">
                            <AlertTriangleIcon className="h-5 w-5" />
                            خطأ في التحقق من صحة البيانات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {validationResult.errors.map((error, index) => (
                                <div key={index} className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-900/40 rounded">
                                    <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700 dark:text-red-300 arabic-text">
                                        {error.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Validation Warnings */}
            {hasValidationWarnings && !hasValidationErrors && (
                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-yellow-800 dark:text-yellow-200 arabic-text flex items-center gap-2">
                            <AlertTriangleIcon className="h-5 w-5" />
                            تحذيرات الجدولة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {validationResult.warnings.map((warning, index) => (
                                <div key={index} className="flex items-start gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded">
                                    <AlertTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 arabic-text">
                                        {warning.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                    disabled={
                        isSubmitting || 
                        !title.trim() || 
                        !courseId || 
                        !scheduledDate || 
                        !scheduledTime || 
                        hasValidationErrors ||
                        (autoCreateMeeting && (!meetingLink.trim() || !validateGoogleMeetLink(meetingLink).isValid))
                    }
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