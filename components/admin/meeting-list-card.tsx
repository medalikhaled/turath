"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMeetingCountdown } from "@/hooks/use-meeting-countdown"
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
  UsersIcon,
  MoreHorizontalIcon
} from "lucide-react"
import { formatArabicDateTime, formatDurationArabic } from "@/lib/meeting-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MeetingListCardProps {
  meeting: {
    _id: Id<"meetings">
    courseId: Id<"courses">
    googleMeetLink: string
    password?: string
    scheduledTime: number
    duration: number
    isActive: boolean
    createdBy?: Id<"users">
  }
  course?: {
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
  }
  onEdit: (meetingId: Id<"meetings">) => void
  isCompact?: boolean
  isCurrent?: boolean
}

export function MeetingListCard({ 
  meeting, 
  course, 
  onEdit, 
  isCompact = false,
  isCurrent = false 
}: MeetingListCardProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [copySuccess, setCopySuccess] = React.useState<'link' | 'password' | null>(null)

  const deleteMeeting = useMutation(api.meetings.deleteMeeting)

  const countdown = useMeetingCountdown({
    scheduledTime: meeting.scheduledTime,
    duration: meeting.duration
  })

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meeting.googleMeetLink)
      setCopySuccess('link')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleCopyPassword = async () => {
    if (meeting.password) {
      try {
        await navigator.clipboard.writeText(meeting.password)
        setCopySuccess('password')
        setTimeout(() => setCopySuccess(null), 2000)
      } catch (error) {
        console.error('Failed to copy password:', error)
      }
    }
  }

  const handleDelete = async () => {
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

  const getBadgeVariant = () => {
    switch (countdown.status) {
      case 'live':
        return 'destructive'
      case 'upcoming':
        return countdown.isStartingSoon ? 'default' : 'secondary'
      case 'ended':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (isCompact) {
    return (
      <div className={`p-4 rounded-xl border transition-all duration-300 ${
        isCurrent ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 shadow-sm' : 'bg-gradient-to-r from-muted/20 to-muted/40 border-border/40'
      } ${countdown.status === 'live' ? 'border-red-300/50 bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20' : ''}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm arabic-text truncate">
              {course?.name || 'مقرر غير معروف'}
            </h4>
            <Badge variant={getBadgeVariant()} className="text-xs arabic-text">
              {countdown.status === 'live' && '🔴 '}
              {countdown.timeText}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="arabic-text">{formatDurationArabic(meeting.duration)}</span>
            {course && (
              <span className="arabic-text">{course.students.length} طالب</span>
            )}
          </div>

          {countdown.status === 'live' && (
            <div className="text-center p-3 bg-gradient-to-r from-red-50/50 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20 rounded-lg border border-red-200/30 dark:border-red-800/30">
              <div className="text-lg font-mono font-bold text-red-600 dark:text-red-400">
                {countdown.countdownText}
              </div>
              <div className="w-full bg-red-200/50 dark:bg-red-800/50 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${countdown.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-1 space-x-reverse">
            {countdown.status === 'live' && (
              <Button
                size="sm"
                onClick={handleOpenMeeting}
                className="flex-1 text-xs arabic-text bg-red-600 hover:bg-red-700"
              >
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
                دخول
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(meeting._id)}
              className="text-xs"
            >
              <EditIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border transition-colors duration-200 ${
      countdown.status === 'live' 
        ? 'border-red-400 dark:border-red-500' 
        : 'border-border hover:border-muted-foreground/30'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold arabic-text">
                {course?.name || 'مقرر غير معروف'}
              </h3>
              <p className="text-sm text-muted-foreground arabic-text">
                الأستاذ: {course?.instructor || 'غير محدد'}
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Badge variant={getBadgeVariant()} className="arabic-text">
                {countdown.status === 'live' && '🔴 '}
                {countdown.timeText}
              </Badge>
              {course && (
                <Badge variant="outline" className="arabic-text">
                  <UsersIcon className="h-3 w-3 ml-1" />
                  {course.students.length}
                </Badge>
              )}
            </div>
          </div>

          {/* Meeting Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 ml-2 text-muted-foreground" />
              <span className="arabic-text">{formatArabicDateTime(meeting.scheduledTime)}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 ml-2 text-muted-foreground" />
              <span className="arabic-text">{formatDurationArabic(meeting.duration)}</span>
            </div>
          </div>

          {/* Live Meeting Countdown */}
          {countdown.status === 'live' && (
            <div className="text-center p-3 rounded-lg border border-red-300 dark:border-red-600">
              <div className="text-2xl font-mono font-bold text-red-600 dark:text-red-400 mb-1">
                {countdown.countdownText}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 arabic-text">
                الوقت المتبقي للانتهاء
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div 
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${countdown.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-2 space-x-reverse">
              {countdown.status === 'live' && (
                <Button
                  onClick={handleOpenMeeting}
                  className="arabic-text bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  <ExternalLinkIcon className="h-4 w-4 ml-2" />
                  دخول الجلسة
                </Button>
              )}
              {countdown.status === 'upcoming' && (
                <Button
                  onClick={handleOpenMeeting}
                  variant="outline"
                  size="sm"
                  className="arabic-text"
                >
                  <ExternalLinkIcon className="h-4 w-4 ml-2" />
                  فتح الرابط
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-1 space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="text-xs"
              >
                <CopyIcon className="h-3 w-3" />
                {copySuccess === 'link' ? 'تم!' : ''}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(meeting._id)} className="arabic-text">
                    <EditIcon className="h-4 w-4 ml-2" />
                    تعديل الجلسة
                  </DropdownMenuItem>
                  {meeting.password && (
                    <DropdownMenuItem onClick={handleCopyPassword} className="arabic-text">
                      <KeyIcon className="h-4 w-4 ml-2" />
                      نسخ كلمة المرور
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="arabic-text text-red-600 focus:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4 ml-2" />
                    حذف الجلسة
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="arabic-text">تأكيد حذف الجلسة</AlertDialogTitle>
            <AlertDialogDescription className="arabic-text">
              هل أنت متأكد من حذف هذه الجلسة؟ لن يتمكن الطلاب من الوصول إليها بعد الحذف.
              <br />
              <strong>المقرر:</strong> {course?.name || 'غير محدد'}
              <br />
              <strong>التاريخ:</strong> {formatArabicDateTime(meeting.scheduledTime)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse">
            <AlertDialogCancel className="arabic-text">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 arabic-text"
            >
              {isDeleting ? 'جاري الحذف...' : 'حذف الجلسة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}