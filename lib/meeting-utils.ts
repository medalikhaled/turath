import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns"
import { ar } from "date-fns/locale"

export interface MeetingTimeInfo {
  status: 'upcoming' | 'live' | 'ended'
  timeText: string
  timeRemaining?: number // in milliseconds
  isStartingSoon?: boolean // within 15 minutes
}

/**
 * Calculate meeting status and time information for display
 */
export function getMeetingTimeInfo(scheduledTime: number, duration: number): MeetingTimeInfo {
  const now = Date.now()
  const endTime = scheduledTime + (duration * 60 * 1000)
  const fifteenMinutes = 15 * 60 * 1000

  if (now < scheduledTime) {
    const timeRemaining = scheduledTime - now
    const isStartingSoon = timeRemaining <= fifteenMinutes
    
    return {
      status: 'upcoming',
      timeText: formatArabicTimeDistance(scheduledTime),
      timeRemaining,
      isStartingSoon
    }
  } else if (now >= scheduledTime && now <= endTime) {
    const timeRemaining = endTime - now
    
    return {
      status: 'live',
      timeText: formatRemainingTime(timeRemaining),
      timeRemaining
    }
  } else {
    return {
      status: 'ended',
      timeText: `انتهت ${formatArabicTimeDistance(endTime)}`
    }
  }
}

/**
 * Format time distance in Arabic
 */
export function formatArabicTimeDistance(date: number): string {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ar 
    })
  } catch {
    return 'منذ وقت قريب'
  }
}

/**
 * Format remaining time for live meetings
 */
export function formatRemainingTime(milliseconds: number): string {
  const totalMinutes = Math.ceil(milliseconds / (60 * 1000))
  
  if (totalMinutes <= 0) {
    return 'انتهت الجلسة'
  }
  
  if (totalMinutes < 60) {
    return `${totalMinutes} دقيقة متبقية`
  }
  
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (minutes === 0) {
    return `${hours} ساعة متبقية`
  }
  
  return `${hours} ساعة و ${minutes} دقيقة متبقية`
}

/**
 * Format countdown timer (HH:MM:SS)
 */
export function formatCountdownTimer(milliseconds: number): string {
  if (milliseconds <= 0) {
    return '00:00:00'
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format Arabic date and time
 */
export function formatArabicDateTime(date: number): string {
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

/**
 * Format duration in Arabic
 */
export function formatDurationArabic(minutes: number): string {
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

/**
 * Validate Google Meet link format
 */
export function validateGoogleMeetLink(link: string): { 
  isValid: boolean
  formatted?: string
  error?: string 
} {
  if (!link.trim()) {
    return { isValid: false, error: 'رابط Google Meet مطلوب' }
  }

  const cleanLink = link.trim()

  // Google Meet URL patterns
  const meetPatterns = [
    /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/,
    /^meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^meet\.google\.com\/[a-z0-9-]+$/,
    /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/,
    /^[a-z0-9-]+$/
  ]

  let formattedLink = cleanLink

  // Add protocol if missing
  if (!formattedLink.startsWith('https://')) {
    if (formattedLink.startsWith('meet.google.com/')) {
      formattedLink = 'https://' + formattedLink
    } else if (meetPatterns.some(pattern => pattern.test(formattedLink))) {
      formattedLink = 'https://meet.google.com/' + formattedLink
    }
  }

  // Validate final format
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

/**
 * Check if a meeting is happening now
 */
export function isMeetingLive(scheduledTime: number, duration: number): boolean {
  const now = Date.now()
  const endTime = scheduledTime + (duration * 60 * 1000)
  return now >= scheduledTime && now <= endTime
}

/**
 * Get next meeting from a list of meetings
 */
export function getNextMeeting<T extends { scheduledTime: number; duration: number }>(
  meetings: T[]
): T | null {
  const now = Date.now()
  
  // First check for live meetings
  const liveMeeting = meetings.find(meeting => 
    isMeetingLive(meeting.scheduledTime, meeting.duration)
  )
  
  if (liveMeeting) {
    return liveMeeting
  }
  
  // Then find next upcoming meeting
  const upcomingMeetings = meetings
    .filter(meeting => meeting.scheduledTime > now)
    .sort((a, b) => a.scheduledTime - b.scheduledTime)
  
  return upcomingMeetings[0] || null
}

/**
 * Calculate time until next meeting starts
 */
export function getTimeUntilMeeting(scheduledTime: number): number {
  return Math.max(0, scheduledTime - Date.now())
}