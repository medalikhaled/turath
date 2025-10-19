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
    if (!formData.googleMeetLink.trim()) return "رابط الجلسة مطلوب"
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
            meetingData: {
              googleMeetLink: formData.googleMeetLink,
              password: formData.meetingPassword || undefined,
              duration: formData.duration,
              scheduledTime
            }
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
        // Create new event - always with meeting
        if (formData.eventType === "lesson") {
          await createLessonWithMeeting({
            courseId: formData.courseId as Id<"courses">,
            title: formData.title,
            description: formData.description || undefined,
            scheduledTime,
            createMeeting: true,
            meetingData: {
              googleMeetLink: formData.googleMeetLink,
              password: formData.meetingPassword || undefined,
              duration: formData.duration
            }
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <Card className="bg-[#0f1729] border-blue-500/30">
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="arabic-text text-white">العنوان</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="عنوان الحدث"
                dir="rtl"
                className="bg-[#1a2332] border-blue-500/30 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course" className="arabic-text text-white">المادة</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) => handleInputChange("courseId", value)}
              >
                <SelectTrigger id="course" dir="rtl" className="bg-[#1a2332] border-blue-500/30 text-white">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="arabic-text text-white">الوصف (اختياري)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="وصف الحدث"
              dir="rtl"
              rows={2}
              className="bg-[#1a2332] border-blue-500/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meet-link" className="arabic-text text-white">رابط Google Meet</Label>
              <Input
                id="meet-link"
                value={formData.googleMeetLink}
                onChange={(e) => handleInputChange("googleMeetLink", e.target.value)}
                placeholder="https://meet.google.com/..."
                dir="ltr"
                className="bg-[#1a2332] border-blue-500/30 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="arabic-text text-white">كلمة مرور الجلسة (اختياري)</Label>
              <Input
                id="password"
                value={formData.meetingPassword}
                onChange={(e) => handleInputChange("meetingPassword", e.target.value)}
                placeholder="كلمة المرور"
                dir="rtl"
                className="bg-[#1a2332] border-blue-500/30 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="arabic-text text-white">التاريخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange("scheduledDate", e.target.value)}
                className="bg-[#1a2332] border-blue-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="arabic-text text-white">الوقت</Label>
              <Input
                id="time"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange("scheduledTime", e.target.value)}
                className="bg-[#1a2332] border-blue-500/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="arabic-text text-white">المدة (دقيقة)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                min="15"
                max="480"
                className="bg-[#1a2332] border-blue-500/30 text-white"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="arabic-text">
          إلغاء
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className={cn(
            "arabic-text",
            hasConflicts && "bg-orange-600 hover:bg-orange-700"
          )}
        >
          {isSubmitting && <Loader2Icon className="h-4 w-4 ml-2 animate-spin" />}
          {hasConflicts ? "حفظ مع التعارض" : editingEventId ? "تحديث" : "إنشاء"}
        </Button>
      </div>
    </form>
  )
}