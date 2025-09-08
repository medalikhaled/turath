"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  VideoIcon, 
  LinkIcon,
  KeyIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  TrashIcon,
  CopyIcon,
  ExternalLinkIcon,
  UsersIcon
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface MeetingCardProps {
  meeting: {
    _id: Id<"meetings">
    courseId: Id<"courses">
    googleMeetLink: string
    password?: string
    scheduledTime: number
    duration: number
    isActive: boolean
    createdBy: Id<"students">
  }
  courses: Array<{
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
  }>
  onEdit: (meetingId: Id<"meetings">) => void
  isCurrent?: boolean
}

function formatArabicDateTime(date: number): string {
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  } catch {
    return 'تاريخ غير صحيح'
  }
}

function formatArabicDate(date: number): string {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ar 
    })
  } catch {
    return 'منذ وقت قريب'
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} دقيقة`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours} ساعة`
  }
  return `${hours} ساعة و ${remainingMinutes} دقيقة`
}

function getMeetingStatus(scheduledTime: number, duration: number): {
  status: 'upcoming' | 'live' | 'ended'
  timeText: string
  badgeVariant: 'default' | 'destructive' | 'secondary'
} {
  const now = Date.now()
  const endTime = scheduledTime + (duration * 60 * 1000)

  if (now < scheduledTime) {
    return {
      status: 'upcoming',
      timeText: formatArabicDate(scheduledTime),
      badgeVariant: 'default'
    }
  } else if (now >= scheduledTime && now <= endTime) {
    const remainingMinutes = Math.ceil((endTime - now) / (60 * 1000))
    return {
      status: 'live',
      timeText: `جارية الآن - ${remainingMinutes} دقيقة متبقية`,
      badgeVariant: 'destructive'
    }
  } else {
    return {
      status: 'ended',
      timeText: `انتهت ${formatArabicDate(endTime)}`,
      badgeVariant: 'secondary'
    }
  }
}

export function MeetingCard({ meeting, courses, onEdit, isCurrent = false }: MeetingCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const deleteMeeting = useMutation(api.meetings.deleteMeeting)

  const course = courses.find(c => c._id === meeting.courseId)
  const meetingStatus = getMeetingStatus(meeting.scheduledTime, meeting.duration)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meeting.googleMeetLink)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleCopyPassword = async () => {
    if (meeting.password) {
      try {
        await navigator.clipboard.writeText(meeting.password)
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy password:', error)
      }
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      await deleteMeeting({ id: meeting._id })
    } catch (error) {
      console.error('Error deleting meeting:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleOpenMeeting = () => {
    window.open(meeting.googleMeetLink, '_blank')
  }

  return (
    <Card className={`${isCurrent ? 'border-primary bg-primary/5' : ''} ${
      meetingStatus.status === 'live' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Course Info */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold arabic-text text-lg">
                  {course?.name || 'مقرر غير معروف'}
                </h3>
                <p className="text-sm text-muted-foreground arabic-text">
                  الأستاذ: {course?.instructor || 'غير محدد'}
                </p>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant={meetingStatus.badgeVariant} className="arabic-text">
                  {meetingStatus.status === 'live' && '🔴 '}
                  {meetingStatus.timeText}
                </Badge>
                {course && (
                  <Badge variant="outline" className="arabic-text">
                    <UsersIcon className="h-3 w-3 ml-1" />
                    {course.students.length} طالب
                  </Badge>
                )}
              </div>
            </div>

            {/* Meeting Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CalendarIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="arabic-text">{formatArabicDateTime(meeting.scheduledTime)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="arabic-text">{formatDuration(meeting.duration)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <LinkIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]" dir="ltr">
                    {meeting.googleMeetLink}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-6 w-6 p-0 ml-1"
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                </div>
                {meeting.password && (
                  <div className="flex items-center text-sm">
                    <KeyIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                    <span className="font-mono">{meeting.password}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPassword}
                      className="h-6 w-6 p-0 ml-1"
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2 space-x-reverse">
            {meetingStatus.status === 'live' && (
              <Button
                onClick={handleOpenMeeting}
                className="arabic-text bg-red-600 hover:bg-red-700"
              >
                <ExternalLinkIcon className="h-4 w-4 ml-2" />
                دخول الجلسة
              </Button>
            )}
            {meetingStatus.status === 'upcoming' && (
              <Button
                onClick={handleOpenMeeting}
                variant="outline"
                className="arabic-text"
              >
                <ExternalLinkIcon className="h-4 w-4 ml-2" />
                فتح الرابط
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(meeting._id)}
              className="arabic-text"
            >
              <EditIcon className="h-4 w-4 ml-1" />
              تعديل
            </Button>
            
            {showDeleteConfirm ? (
              <div className="flex items-center space-x-1 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="arabic-text"
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="arabic-text"
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 ml-1" />
                      تأكيد الحذف
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="arabic-text text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 ml-1" />
                حذف
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}