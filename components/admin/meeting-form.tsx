"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  VideoIcon, 
  LinkIcon,
  KeyIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon
} from "lucide-react"

interface MeetingFormProps {
  meetingId?: Id<"meetings"> | null
  courses: Array<{
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
  }>
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  courseId: string
  googleMeetLink: string
  password: string
  scheduledDate: string
  scheduledTime: string
  duration: number
}

interface ValidationErrors {
  courseId?: string
  googleMeetLink?: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: string
}

// Google Meet link validation
function validateGoogleMeetLink(link: string): { isValid: boolean; formatted?: string; error?: string } {
  if (!link.trim()) {
    return { isValid: false, error: 'رابط Google Meet مطلوب' }
  }

  // Remove whitespace
  const cleanLink = link.trim()

  // Check if it's a valid Google Meet URL pattern
  const meetPatterns = [
    /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/,
    /^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^meet\.google\.com\/[a-z0-9-]+$/,
    /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^[a-z0-9-]+$/
  ]

  let formattedLink = cleanLink

  // If it doesn't start with https://, add it
  if (!formattedLink.startsWith('https://')) {
    if (formattedLink.startsWith('meet.google.com/')) {
      formattedLink = 'https://' + formattedLink
    } else if (meetPatterns.some(pattern => pattern.test(formattedLink))) {
      formattedLink = 'https://meet.google.com/' + formattedLink
    }
  }

  // Final validation
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
}

// Time validation
function validateDateTime(date: string, time: string): { isValid: boolean; error?: string } {
  if (!date || !time) {
    return { isValid: false, error: 'التاريخ والوقت مطلوبان' }
  }

  const scheduledDateTime = new Date(`${date}T${time}`)
  const now = new Date()

  if (scheduledDateTime <= now) {
    return { isValid: false, error: 'يجب أن يكون موعد الجلسة في المستقبل' }
  }

  return { isValid: true }
}

export function MeetingForm({ meetingId, courses, onSuccess, onCancel }: MeetingFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    courseId: '',
    googleMeetLink: '',
    password: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60
  })
  
  const [errors, setErrors] = React.useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [linkValidation, setLinkValidation] = React.useState<{
    isValid: boolean
    formatted?: string
    error?: string
  }>({ isValid: false })

  const existingMeeting = useQuery(
    api.meetings.getMeeting, 
    meetingId ? { id: meetingId } : "skip"
  )

  const createMeeting = useMutation(api.meetings.createMeeting)
  const updateMeeting = useMutation(api.meetings.updateMeeting)
  // Removed conflict checking for now to simplify the form

  // Load existing meeting data for editing
  React.useEffect(() => {
    if (existingMeeting && meetingId) {
      const scheduledDate = new Date(existingMeeting.scheduledTime)
      setFormData({
        courseId: existingMeeting.courseId,
        googleMeetLink: existingMeeting.googleMeetLink,
        password: existingMeeting.password || '',
        scheduledDate: scheduledDate.toISOString().split('T')[0],
        scheduledTime: scheduledDate.toTimeString().slice(0, 5),
        duration: existingMeeting.duration
      })
      
      // Validate existing link
      const validation = validateGoogleMeetLink(existingMeeting.googleMeetLink)
      setLinkValidation(validation)
    }
  }, [existingMeeting, meetingId])

  // Validate Google Meet link on change
  React.useEffect(() => {
    if (formData.googleMeetLink) {
      const validation = validateGoogleMeetLink(formData.googleMeetLink)
      setLinkValidation(validation)
    } else {
      setLinkValidation({ isValid: false })
    }
  }, [formData.googleMeetLink])

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.courseId) {
      newErrors.courseId = 'يجب اختيار المقرر الدراسي'
    }

    const linkValidation = validateGoogleMeetLink(formData.googleMeetLink)
    if (!linkValidation.isValid) {
      newErrors.googleMeetLink = linkValidation.error
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'التاريخ مطلوب'
    }

    if (!formData.scheduledTime) {
      newErrors.scheduledTime = 'الوقت مطلوب'
    }

    const dateTimeValidation = validateDateTime(formData.scheduledDate, formData.scheduledTime)
    if (!dateTimeValidation.isValid) {
      newErrors.scheduledDate = dateTimeValidation.error
    }

    if (formData.duration < 15 || formData.duration > 480) {
      newErrors.duration = 'مدة الجلسة يجب أن تكون بين 15 دقيقة و 8 ساعات'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
      const scheduledTime = scheduledDateTime.getTime()

      const meetingData = {
        courseId: formData.courseId as Id<"courses">,
        googleMeetLink: linkValidation.formatted || formData.googleMeetLink,
        password: formData.password || undefined,
        scheduledTime,
        duration: formData.duration,
      }

      if (meetingId) {
        await updateMeeting({
          id: meetingId,
          ...meetingData
        })
      } else {
        await createMeeting(meetingData)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving meeting:', error)
      setErrors({ 
        courseId: 'حدث خطأ أثناء حفظ الجلسة. يرجى المحاولة مرة أخرى.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCourse = courses.find(course => course._id === formData.courseId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* Course Selection */}
      <div className="space-y-2">
        <Label htmlFor="courseId" className="arabic-text">المقرر الدراسي</Label>
        <Select
          value={formData.courseId}
          onValueChange={(value) => handleInputChange('courseId', value)}
        >
          <SelectTrigger className={errors.courseId ? 'border-red-500' : ''}>
            <SelectValue placeholder="اختر المقرر الدراسي" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                <div className="text-right">
                  <div className="font-medium arabic-text">{course.name}</div>
                  <div className="text-sm text-muted-foreground arabic-text">
                    الأستاذ: {course.instructor}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.courseId && (
          <p className="text-sm text-red-500 arabic-text flex items-center" role="alert">
            <AlertCircleIcon className="h-4 w-4 ml-1" aria-hidden="true" />
            {errors.courseId}
          </p>
        )}
      </div>

      {/* Selected Course Info */}
      {selectedCourse && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium arabic-text">{selectedCourse.name}</h3>
                <p className="text-sm text-muted-foreground arabic-text">
                  {selectedCourse.description}
                </p>
              </div>
              <Badge variant="secondary" className="arabic-text">
                {selectedCourse.students.length} طالب
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Meet Link */}
      <div className="space-y-2">
        <Label htmlFor="googleMeetLink" className="arabic-text flex items-center">
          <LinkIcon className="h-4 w-4 ml-1" aria-hidden="true" />
          رابط Google Meet
        </Label>
        <div className="relative">
          <Input
            id="googleMeetLink"
            type="url"
            value={formData.googleMeetLink}
            onChange={(e) => handleInputChange('googleMeetLink', e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className={`text-left ${errors.googleMeetLink ? 'border-red-500' : ''} ${
              linkValidation.isValid ? 'border-green-500' : ''
            }`}
            dir="ltr"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {formData.googleMeetLink && (
              linkValidation.isValid ? (
                <CheckIcon className="h-4 w-4 text-green-500" aria-label="رابط صحيح" />
              ) : (
                <XIcon className="h-4 w-4 text-red-500" aria-label="رابط غير صحيح" />
              )
            )}
          </div>
        </div>
        {errors.googleMeetLink && (
          <p className="text-sm text-red-500 arabic-text flex items-center">
            <AlertCircleIcon className="h-4 w-4 ml-1" />
            {errors.googleMeetLink}
          </p>
        )}
        {linkValidation.isValid && linkValidation.formatted !== formData.googleMeetLink && (
          <p className="text-sm text-green-600 arabic-text">
            سيتم حفظ الرابط كـ: {linkValidation.formatted}
          </p>
        )}
      </div>

      {/* Meeting Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="arabic-text flex items-center">
          <KeyIcon className="h-4 w-4 ml-1" aria-hidden="true" />
          كلمة مرور الجلسة (اختيارية)
        </Label>
        <Input
          id="password"
          type="text"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder="كلمة مرور الجلسة"
          className="arabic-text text-right"
          dir="rtl"
        />
        <p className="text-xs text-muted-foreground arabic-text">
          كلمة المرور ستظهر للطلاب مع رابط الجلسة
        </p>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate" className="arabic-text flex items-center">
            <CalendarIcon className="h-4 w-4 ml-1" aria-hidden="true" />
            التاريخ
          </Label>
          <Input
            id="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
            className={errors.scheduledDate ? 'border-red-500' : ''}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.scheduledDate && (
            <p className="text-sm text-red-500 arabic-text flex items-center">
              <AlertCircleIcon className="h-4 w-4 ml-1" />
              {errors.scheduledDate}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledTime" className="arabic-text flex items-center">
            <ClockIcon className="h-4 w-4 ml-1" aria-hidden="true" />
            الوقت
          </Label>
          <Input
            id="scheduledTime"
            type="time"
            value={formData.scheduledTime}
            onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
            className={errors.scheduledTime ? 'border-red-500' : ''}
          />
          {errors.scheduledTime && (
            <p className="text-sm text-red-500 arabic-text flex items-center">
              <AlertCircleIcon className="h-4 w-4 ml-1" />
              {errors.scheduledTime}
            </p>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration" className="arabic-text">مدة الجلسة (بالدقائق)</Label>
        <Select
          value={formData.duration.toString()}
          onValueChange={(value) => handleInputChange('duration', parseInt(value))}
        >
          <SelectTrigger className={errors.duration ? 'border-red-500' : ''}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 دقيقة</SelectItem>
            <SelectItem value="45">45 دقيقة</SelectItem>
            <SelectItem value="60">ساعة واحدة</SelectItem>
            <SelectItem value="90">ساعة ونصف</SelectItem>
            <SelectItem value="120">ساعتان</SelectItem>
            <SelectItem value="180">3 ساعات</SelectItem>
            <SelectItem value="240">4 ساعات</SelectItem>
          </SelectContent>
        </Select>
        {errors.duration && (
          <p className="text-sm text-red-500 arabic-text flex items-center">
            <AlertCircleIcon className="h-4 w-4 ml-1" />
            {errors.duration}
          </p>
        )}
      </div>



      {/* Action Buttons */}
      <div className="flex items-center justify-start gap-4 pt-6 border-t bg-muted/20 -mx-8 px-8 py-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="arabic-text"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !linkValidation.isValid}
          className="arabic-text"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2" />
              {meetingId ? 'جاري التحديث...' : 'جاري الإنشاء...'}
            </>
          ) : (
            <>
              <VideoIcon className="h-4 w-4 ml-2" />
              {meetingId ? 'تحديث الجلسة' : 'إنشاء الجلسة'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}