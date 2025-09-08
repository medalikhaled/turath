"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMeetingCountdown } from "@/hooks/use-meeting-countdown"
import { 
  VideoIcon, 
  LinkIcon,
  KeyIcon,
  ClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  CalendarIcon,
  PlayIcon
} from "lucide-react"
import { formatArabicDateTime } from "@/lib/meeting-utils"

interface CurrentMeetingProps {
  className?: string
}

export function CurrentMeeting({ className }: CurrentMeetingProps) {
  const [copySuccess, setCopySuccess] = React.useState<'link' | 'password' | null>(null)
  
  const currentMeeting = useQuery(api.meetings.getCurrentMeetingWithCourse)
  
  const countdown = useMeetingCountdown({
    scheduledTime: currentMeeting?.scheduledTime || 0,
    duration: currentMeeting?.duration || 0,
    onMeetingStart: () => {
      // Could trigger a notification or sound here
      console.log('Meeting started!')
    },
    onMeetingEnd: () => {
      // Could trigger a notification here
      console.log('Meeting ended!')
    }
  })

  const handleCopyLink = async () => {
    if (!currentMeeting?.googleMeetLink) return
    
    try {
      await navigator.clipboard.writeText(currentMeeting.googleMeetLink)
      setCopySuccess('link')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleCopyPassword = async () => {
    if (!currentMeeting?.password) return
    
    try {
      await navigator.clipboard.writeText(currentMeeting.password)
      setCopySuccess('password')
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (error) {
      console.error('Failed to copy password:', error)
    }
  }

  const handleJoinMeeting = () => {
    if (currentMeeting?.googleMeetLink) {
      window.open(currentMeeting.googleMeetLink, '_blank')
    }
  }

  if (!currentMeeting) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="arabic-text flex items-center">
            <VideoIcon className="h-5 w-5 ml-2" />
            الجلسة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium arabic-text mb-2">لا توجد جلسات مجدولة</h3>
            <p className="text-muted-foreground arabic-text">
              لا توجد جلسات مجدولة في الوقت الحالي
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentMeeting.course) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isLive = countdown.status === 'live'
  const isStartingSoon = countdown.isStartingSoon && countdown.status === 'upcoming'

  return (
    <Card className={`${className} ${isLive ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''} ${
      isStartingSoon ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''
    }`}>
      <CardHeader>
        <CardTitle className="arabic-text flex items-center justify-between">
          <div className="flex items-center">
            <VideoIcon className="h-5 w-5 ml-2" />
            {isLive ? 'الجلسة الحالية' : 'الجلسة القادمة'}
          </div>
          <Badge 
            variant={isLive ? 'destructive' : isStartingSoon ? 'default' : 'secondary'}
            className="arabic-text"
          >
            {isLive && '🔴 '}
            {countdown.timeText}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course Information */}
        <div>
          <h3 className="text-xl font-semibold arabic-text mb-1">
            {currentMeeting.course.name}
          </h3>
          <p className="text-muted-foreground arabic-text">
            الأستاذ: {currentMeeting.course.instructor}
          </p>
        </div>

        {/* Countdown Timer */}
        {(countdown.status === 'upcoming' || countdown.status === 'live') && (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold mb-2">
              {countdown.countdownText}
            </div>
            <p className="text-sm text-muted-foreground arabic-text">
              {countdown.status === 'upcoming' ? 'الوقت المتبقي للبدء' : 'الوقت المتبقي للانتهاء'}
            </p>
            {countdown.status === 'live' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${countdown.progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Meeting Details */}
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 ml-2 text-muted-foreground" />
            <span className="arabic-text">{formatArabicDateTime(currentMeeting.scheduledTime)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <ClockIcon className="h-4 w-4 ml-2 text-muted-foreground" />
            <span className="arabic-text">
              {currentMeeting.duration < 60 
                ? `${currentMeeting.duration} دقيقة`
                : `${Math.floor(currentMeeting.duration / 60)} ساعة${currentMeeting.duration % 60 > 0 ? ` و ${currentMeeting.duration % 60} دقيقة` : ''}`
              }
            </span>
          </div>
        </div>

        {/* Meeting Link */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium arabic-text">رابط الجلسة</span>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="arabic-text"
              >
                <CopyIcon className="h-3 w-3 ml-1" />
                {copySuccess === 'link' ? 'تم النسخ!' : 'نسخ'}
              </Button>
            </div>
          </div>

          {/* Password if available */}
          {currentMeeting.password && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <KeyIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium arabic-text">كلمة المرور</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-mono text-sm">{currentMeeting.password}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="arabic-text"
                >
                  <CopyIcon className="h-3 w-3 ml-1" />
                  {copySuccess === 'password' ? 'تم النسخ!' : 'نسخ'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Join Button */}
        <Button
          onClick={handleJoinMeeting}
          className={`w-full arabic-text ${
            isLive 
              ? 'bg-red-600 hover:bg-red-700' 
              : isStartingSoon 
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : ''
          }`}
          size="lg"
        >
          {isLive ? (
            <>
              <PlayIcon className="h-5 w-5 ml-2" />
              دخول الجلسة الآن
            </>
          ) : (
            <>
              <ExternalLinkIcon className="h-5 w-5 ml-2" />
              فتح رابط الجلسة
            </>
          )}
        </Button>

        {/* Status Messages */}
        {isStartingSoon && (
          <div className="text-center p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 arabic-text font-medium">
              ⏰ الجلسة ستبدأ خلال أقل من 15 دقيقة
            </p>
          </div>
        )}

        {isLive && (
          <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 arabic-text font-medium">
              🔴 الجلسة جارية الآن - انضم بسرعة!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}