"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CopyIcon, VideoIcon, ClockIcon, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCountdown } from "@/hooks/use-countdown"
import { toast } from "sonner"
import { formatArabicDate, toArabicNumerals } from "@/lib/arabic-date"
import { Id } from "@/convex/_generated/dataModel"

interface CurrentLessonCardProps {
  currentMeeting?: {
    _id: Id<"meetings">
    googleMeetLink: string
    password?: string
    scheduledTime: number
    duration: number
    courseId: Id<"courses">
    isActive: boolean
    createdBy?: Id<"users">
  } | null
  nextLesson?: {
    _id: Id<"lessons">
    title: string
    scheduledTime: number
    courseId: Id<"courses">
    meetingId?: Id<"meetings">
    description?: string
    recordingUrl?: string
    resources: Id<"files">[]
    course?: {
      _id: Id<"courses">
      _creationTime: number
      students: Id<"students">[]
      name: string
      isActive: boolean
      description: string
      instructor: string
      createdAt: number
    } | null
  } | null
}

export function CurrentLessonCard({ currentMeeting, nextLesson }: CurrentLessonCardProps) {
  const now = Date.now()
  const isLive = currentMeeting && 
    currentMeeting.scheduledTime <= now && 
    (currentMeeting.scheduledTime + currentMeeting.duration * 60000) > now

  const nextSessionTime = isLive 
    ? currentMeeting.scheduledTime + currentMeeting.duration * 60000
    : nextLesson?.scheduledTime || 0

  const { timeLeft, isExpired } = useCountdown(nextSessionTime)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`تم نسخ ${type} بنجاح`)
    } catch (error) {
      toast.error(`فشل في نسخ ${type}`)
    }
  }

  const formatTime = (timestamp: number) => {
    return formatArabicDate(timestamp, { includeTime: true })
  }

  if (!currentMeeting && !nextLesson) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold arabic-text mb-2">
            لا توجد دروس مجدولة
          </h3>
          <p className="text-muted-foreground arabic-text text-center">
            لا توجد دروس مجدولة في الوقت الحالي. سيتم إشعارك عند إضافة دروس جديدة.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      isLive ? "border-green-500 bg-gradient-to-br from-green-50/20 to-emerald-50/10 shadow-lg shadow-green-500/20" 
             : "border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/10 hover:border-primary/40"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="arabic-text flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isLive ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"
            )}>
              <VideoIcon className="h-5 w-5" />
            </div>
            {isLive ? "الدرس الحالي" : "الدرس القادم"}
          </CardTitle>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse shadow-lg">
              🔴 مباشر الآن
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lesson Info */}
        <div className="space-y-2">
          <h3 className="font-semibold arabic-text">
            {nextLesson?.title || nextLesson?.course?.name || "درس"}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span className="arabic-text">
              {formatTime(isLive ? currentMeeting.scheduledTime : nextLesson?.scheduledTime || 0)}
            </span>
          </div>
        </div>

        {/* Google Meet Link */}
        {currentMeeting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium arabic-text mb-1">رابط Google Meet</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentMeeting.googleMeetLink}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(currentMeeting.googleMeetLink, "الرابط")}
                className="shrink-0 ml-2"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Meeting Password */}
            {currentMeeting.password && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium arabic-text mb-1">كلمة المرور</p>
                  <p className="text-sm font-mono">{currentMeeting.password}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(currentMeeting.password!, "كلمة المرور")}
                  className="shrink-0 ml-2"
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Join Meeting Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.open(currentMeeting.googleMeetLink, '_blank')}
            >
              <VideoIcon className="h-4 w-4 mr-2" />
              <span className="arabic-text">
                {isLive ? "انضم للدرس الآن" : "انضم للدرس"}
              </span>
            </Button>
          </div>
        )}

        {/* Countdown Timer */}
        {!isExpired && nextSessionTime > 0 && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium arabic-text">
                {isLive ? "ينتهي خلال" : "يبدأ خلال"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-background rounded-lg p-3 border border-primary/20 shadow-sm">
                <div className="text-xl font-bold text-primary">{toArabicNumerals(timeLeft.days)}</div>
                <div className="text-xs text-muted-foreground arabic-text">يوم</div>
              </div>
              <div className="bg-background rounded-lg p-3 border border-primary/20 shadow-sm">
                <div className="text-xl font-bold text-primary">{toArabicNumerals(timeLeft.hours)}</div>
                <div className="text-xs text-muted-foreground arabic-text">ساعة</div>
              </div>
              <div className="bg-background rounded-lg p-3 border border-primary/20 shadow-sm">
                <div className="text-xl font-bold text-primary">{toArabicNumerals(timeLeft.minutes)}</div>
                <div className="text-xs text-muted-foreground arabic-text">دقيقة</div>
              </div>
              <div className="bg-background rounded-lg p-3 border border-primary/20 shadow-sm">
                <div className="text-xl font-bold text-primary">{toArabicNumerals(timeLeft.seconds)}</div>
                <div className="text-xs text-muted-foreground arabic-text">ثانية</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}