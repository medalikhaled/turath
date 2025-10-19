"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2Icon, AlertTriangleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Course {
  _id: Id<"courses">
  name: string
  description: string
  instructor: string
  isActive: boolean
}

interface UnifiedEventFormProps {
  selectedDate: Date | null
  editingEventId: string | null
  editingEventType: "lesson" | "meeting" | null
  courses: Course[]
  onSuccess: () => void
  onCancel: () => void
}

export function UnifiedEventForm({
  selectedDate,
  editingEventId,
  editingEventType,
  courses,
  onSuccess,
  onCancel
}: UnifiedEventFormProps) {
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    googleMeetLink: "",
    meetingPassword: "",
    createMeeting: true,
    eventType: "lesson" as "lesson" | "meeting"
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Queries for editing
  const existingLesson = useQuery(
    api.lessons.getLessonWithMeeting,
    editingEventType === "lesson" && editingEventId 
      ? { id: editingEventId as Id<"lessons"> }
      : "skip"
  )
  
  const existingMeeting = useQuery(
    api.meetings.getMeeting,
    editingEventType === "meeting" && editingEventId
      ? { id: editingEventId as Id<"meetings"> }
      : "skip"
  )

  // Mutations
  const createLessonWithMeeting = useMutation(api.lessons.createLessonWithMeeting)
  const createMeeting = useMutation(api.meetings.createMeeting)
  const updateLesson = useMutation(api.lessons.updateLessonWithMeeting)
  const updateMeeting = useMutation(api.meetings.updateMeeting)

  // Conflict checking
  const conflictCheck = useQuery(
    api.meetings.checkSchedulingConflict,
    formData.scheduledDate && formData.scheduledTime && formData.courseId
      ? {
          scheduledTime: new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).getTime(),
          duration: formData.duration,
          excludeMeetingId: editingEventType === "meeting" && editingEventId 
            ? editingEventId as Id<"meetings">
            : undefined
        }
      : "skip"
  )

  // Initialize form data
  useEffect(() => {
    if (selectedDate) {
      const date = selectedDate.toISOString().split('T')[0]
      const time = selectedDate.toTimeString().slice(0, 5)
      setFormData(prev => ({
        ...prev,
        scheduledDate: date,
        scheduledTime: time,
        eventType: "lesson"
      }))
    }
  }, [selectedDate])

  // Load existing event data
  useEffect(() => {
    if (existingLesson) {
      const scheduledDate = new Date(existingLesson.scheduledTime)
      setFormData({
        title: existingLesson.title,
        description: existingLesson.description || "",
        courseId: existingLesson.courseId,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        duration: existingLesson.meeting?.duration || 60,
        googleMeetLink: existingLesson.meeting?.googleMeetLink || "",
        meetingPassword: existingLesson.meeting?.password || "",
        createMeeting: !!existingLesson.meeting,
        eventType: "lesson"
      })
    }
  }, [existingLesson])

  useEffect(() => {
    if (existingMeeting) {
      const scheduledDate = new Date(existingMeeting.scheduledTime)
      setFormData({
        title: `جلسة - ${courses.find(c => c._id === existingMeeting.courseId)?.name || ''}`,
        description: "",
        courseId: existingMeeting.courseId,
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        duration: existingMeeting.duration,
        googleMeetLink: existingMeeting.googleMeetLink,
        meetingPassword: existingMeeting.password || "",
        createMeeting: true,
        eventType: "meeting"
      })
    }
  }, [existingMeeting, courses])

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  const validateForm = () => {
    if (!formData.title.trim()) return "عنوان الحدث مطلوب"
    if (!formData.courseId) return "يجب اختيار المادة"
    if (!formData.scheduledDate) return "تاريخ الحدث مطلوب"
    if (!formData.scheduledTime) return "وقت الحدث مطلوب"
    if (formData.createMeeting && !formData.googleMeetLink.trim()) return "رابط الجلسة مطلوب"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const scheduledTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).getTime()

      if (editingEventId) {
        // Update existing event
        if (editingEventType === "lesson") {
          await updateLesson({
            lessonId: editingEventId as Id<"lessons">,
            lessonData: {
              title: formData.title,
              description: formData.description || undefined,
              scheduledTime
            },
            meetingData: formData.createMeeting ? {
              googleMeetLink: formData.googleMeetLink,
              password: formData.meetingPassword || undefined,
              duration: formData.duration,
              scheduledTime
            } : undefined
          })
        } else {
          await updateMeeting({
            id: editingEventId as Id<"meetings">,
            googleMeetLink: formData.googleMeetLink,
            password: formData.meetingPassword || undefined,
            scheduledTime,
            duration: formData.duration
          })
        }
      } else {
        // Create new event
        if (formData.eventType === "lesson") {
          await createLessonWithMeeting({
            courseId: formData.courseId as Id<"courses">,
            title: formData.title,
            description: formData.description || undefined,
            scheduledTime,
            createMeeting: formData.createMeeting,
            meetingData: formData.createMeeting ? {
              googleMeetLink: formData.googleMeetLink,
              password: formData.meetingPassword || undefined,
              duration: formData.duration
            } : undefined
          })
        } else {
          await createMeeting({
            courseId: formData.courseId as Id<"courses">,
            googleMeetLink: formData.googleMeetLink,
            password: formData.meetingPassword || undefined,
            scheduledTime,
            duration: formData.duration
          })
        }
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving event:", error)
      setError("حدث خطأ أثناء حفظ الحدث")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasConflicts = conflictCheck?.hasConflict && conflictCheck.conflictingMeetings.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="arabic-text">{error}</AlertDescription>
        </Alert>
      )}

      {hasConflicts && (
        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription className="arabic-text">
            يوجد تعارض مع {conflictCheck.conflictingMeetings.length} حدث آخر في نفس الوقت
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">معلومات أساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editingEventId && (
              <div className="space-y-2">
                <Label className="arabic-text">نوع الحدث</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => handleInputChange("eventType", value)}
                >
                  <SelectTrigger dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="lesson">درس</SelectItem>
                    <SelectItem value="meeting">جلسة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="arabic-text">العنوان</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="عنوان الحدث"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-text">الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="وصف الحدث (اختياري)"
                dir="rtl"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-text">المادة</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => handleInputChange("courseId", value)}
              >
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">معلومات الجدولة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="arabic-text">التاريخ</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-text">الوقت</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-text">المدة (بالدقائق)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                min="15"
                max="480"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between arabic-text">
            معلومات الجلسة
            {formData.eventType === "lesson" && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="create-meeting" className="text-sm arabic-text">
                  إنشاء جلسة
                </Label>
                <Switch
                  id="create-meeting"
                  checked={formData.createMeeting}
                  onCheckedChange={(checked) => handleInputChange("createMeeting", checked)}
                />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        {(formData.createMeeting || formData.eventType === "meeting") && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="arabic-text">رابط Google Meet</Label>
              <Input
                value={formData.googleMeetLink}
                onChange={(e) => handleInputChange("googleMeetLink", e.target.value)}
                placeholder="https://meet.google.com/..."
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-text">كلمة مرور الجلسة (اختياري)</Label>
              <Input
                value={formData.meetingPassword}
                onChange={(e) => handleInputChange("meetingPassword", e.target.value)}
                placeholder="كلمة المرور"
                dir="rtl"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className={cn(hasConflicts && "bg-orange-600 hover:bg-orange-700")}
        >
          {isSubmitting && <Loader2Icon className="h-4 w-4 ml-2 animate-spin" />}
          {hasConflicts ? "حفظ مع التعارض" : editingEventId ? "تحديث" : "إنشاء"}
        </Button>
      </div>
    </form>
  )
}