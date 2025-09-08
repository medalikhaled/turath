"use client"

import { useState, useEffect, useCallback } from "react"
import { getMeetingTimeInfo, formatCountdownTimer, getTimeUntilMeeting } from "@/lib/meeting-utils"

interface UseMeetingCountdownProps {
  scheduledTime: number
  duration: number
  onMeetingStart?: () => void
  onMeetingEnd?: () => void
}

interface MeetingCountdownState {
  status: 'upcoming' | 'live' | 'ended'
  timeText: string
  countdownText: string
  timeRemaining: number
  isStartingSoon: boolean
  progress: number // 0-100 for live meetings
}

export function useMeetingCountdown({
  scheduledTime,
  duration,
  onMeetingStart,
  onMeetingEnd
}: UseMeetingCountdownProps): MeetingCountdownState {
  const [state, setState] = useState<MeetingCountdownState>(() => {
    const timeInfo = getMeetingTimeInfo(scheduledTime, duration)
    return {
      status: timeInfo.status,
      timeText: timeInfo.timeText,
      countdownText: formatCountdownTimer(timeInfo.timeRemaining || 0),
      timeRemaining: timeInfo.timeRemaining || 0,
      isStartingSoon: timeInfo.isStartingSoon || false,
      progress: 0
    }
  })

  const updateState = useCallback(() => {
    const now = Date.now()
    const endTime = scheduledTime + (duration * 60 * 1000)
    const timeInfo = getMeetingTimeInfo(scheduledTime, duration)
    
    let progress = 0
    if (timeInfo.status === 'live') {
      const totalDuration = duration * 60 * 1000
      const elapsed = now - scheduledTime
      progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    }

    const newState: MeetingCountdownState = {
      status: timeInfo.status,
      timeText: timeInfo.timeText,
      countdownText: formatCountdownTimer(timeInfo.timeRemaining || 0),
      timeRemaining: timeInfo.timeRemaining || 0,
      isStartingSoon: timeInfo.isStartingSoon || false,
      progress
    }

    setState(prevState => {
      // Trigger callbacks on status changes
      if (prevState.status !== newState.status) {
        if (newState.status === 'live' && onMeetingStart) {
          onMeetingStart()
        } else if (newState.status === 'ended' && onMeetingEnd) {
          onMeetingEnd()
        }
      }
      
      return newState
    })
  }, [scheduledTime, duration, onMeetingStart, onMeetingEnd])

  useEffect(() => {
    // Update immediately
    updateState()

    // Set up interval for updates
    const interval = setInterval(updateState, 1000)

    return () => clearInterval(interval)
  }, [updateState])

  return state
}

// Hook for multiple meetings countdown
interface UseMultipleMeetingsCountdownProps {
  meetings: Array<{
    _id: string
    scheduledTime: number
    duration: number
  }>
}

export function useMultipleMeetingsCountdown({ meetings }: UseMultipleMeetingsCountdownProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return meetings.map(meeting => {
    const timeInfo = getMeetingTimeInfo(meeting.scheduledTime, meeting.duration)
    return {
      ...meeting,
      ...timeInfo,
      countdownText: formatCountdownTimer(timeInfo.timeRemaining || 0)
    }
  })
}