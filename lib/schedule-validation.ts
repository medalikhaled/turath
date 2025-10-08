/**
 * Schedule validation utilities for lesson scheduling
 * Provides date validation, past date prevention, and conflict detection
 */

export interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning'
}

export interface DateValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

export interface ScheduleValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Validation error message constants
export const VALIDATION_MESSAGES = {
  PAST_DATE: 'لا يمكن جدولة درس في تاريخ سابق',
  PAST_TIME: 'لا يمكن جدولة درس في وقت سابق من اليوم',
  INVALID_DATE: 'التاريخ المدخل غير صحيح',
  INVALID_TIME: 'الوقت المدخل غير صحيح',
  TIME_CONFLICT: 'يوجد درس آخر مجدول في نفس الوقت تقريباً',
  WEEKEND_WARNING: 'تحذير: الدرس مجدول في عطلة نهاية الأسبوع',
  LATE_HOUR_WARNING: 'تحذير: الدرس مجدول في وقت متأخر من اليوم'
} as const

/**
 * Validates if a date is not in the past
 */
export function validatePastDate(date: Date): DateValidationResult {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (inputDate < today) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PAST_DATE
    }
  }
  
  return { isValid: true }
}

/**
 * Validates if a datetime is not in the past (including time)
 */
export function validatePastDateTime(dateTime: Date): DateValidationResult {
  const now = new Date()
  
  if (dateTime < now) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const inputDate = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate())
    
    // If it's today but past time
    if (inputDate.getTime() === today.getTime()) {
      return {
        isValid: false,
        error: VALIDATION_MESSAGES.PAST_TIME
      }
    }
    
    // If it's a past date
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.PAST_DATE
    }
  }
  
  return { isValid: true }
}

/**
 * Validates date and time inputs
 */
export function validateDateTimeInputs(dateStr: string, timeStr: string): DateValidationResult {
  if (!dateStr || !timeStr) {
    return {
      isValid: false,
      error: 'التاريخ والوقت مطلوبان'
    }
  }
  
  const dateTime = new Date(`${dateStr}T${timeStr}`)
  
  if (isNaN(dateTime.getTime())) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_DATE
    }
  }
  
  return validatePastDateTime(dateTime)
}

/**
 * Detects time conflicts with existing lessons
 */
export function detectTimeConflicts(
  scheduledTime: number,
  existingLessons: Array<{ _id: string; scheduledTime: number; title: string }>,
  excludeLessonId?: string,
  conflictThresholdMinutes: number = 60
): Array<{ _id: string; scheduledTime: number; title: string }> {
  const conflictThreshold = conflictThresholdMinutes * 60 * 1000 // Convert to milliseconds
  
  return existingLessons.filter(lesson => {
    // Exclude the lesson being edited
    if (excludeLessonId && lesson._id === excludeLessonId) {
      return false
    }
    
    // Check if lessons are within the conflict threshold
    return Math.abs(lesson.scheduledTime - scheduledTime) < conflictThreshold
  })
}

/**
 * Provides warnings for scheduling edge cases
 */
export function getSchedulingWarnings(dateTime: Date): ValidationError[] {
  const warnings: ValidationError[] = []
  
  // Weekend warning (Friday and Saturday in Arabic context)
  const dayOfWeek = dateTime.getDay()
  if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday = 5, Saturday = 6
    warnings.push({
      field: 'scheduledDate',
      message: VALIDATION_MESSAGES.WEEKEND_WARNING,
      type: 'warning'
    })
  }
  
  // Late hour warning (after 9 PM)
  const hour = dateTime.getHours()
  if (hour >= 21) {
    warnings.push({
      field: 'scheduledTime',
      message: VALIDATION_MESSAGES.LATE_HOUR_WARNING,
      type: 'warning'
    })
  }
  
  return warnings
}

/**
 * Comprehensive schedule validation
 */
export function validateSchedule(
  dateStr: string,
  timeStr: string,
  existingLessons: Array<{ _id: string; scheduledTime: number; title: string }>,
  excludeLessonId?: string
): ScheduleValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  // Validate date and time inputs
  const dateTimeValidation = validateDateTimeInputs(dateStr, timeStr)
  if (!dateTimeValidation.isValid) {
    errors.push({
      field: 'scheduledDateTime',
      message: dateTimeValidation.error!,
      type: 'error'
    })
    
    return {
      isValid: false,
      errors,
      warnings
    }
  }
  
  const dateTime = new Date(`${dateStr}T${timeStr}`)
  const scheduledTime = dateTime.getTime()
  
  // Check for time conflicts
  const conflicts = detectTimeConflicts(scheduledTime, existingLessons, excludeLessonId)
  if (conflicts.length > 0) {
    warnings.push({
      field: 'scheduledDateTime',
      message: VALIDATION_MESSAGES.TIME_CONFLICT,
      type: 'warning'
    })
  }
  
  // Add scheduling warnings
  warnings.push(...getSchedulingWarnings(dateTime))
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Utility to check if a lesson should be displayed in current week
 */
export function isLessonInCurrentWeek(lessonTime: number): boolean {
  const now = new Date()
  const currentWeekStart = getWeekStart(now)
  const currentWeekEnd = getWeekEnd(now)
  
  return lessonTime >= currentWeekStart.getTime() && lessonTime <= currentWeekEnd.getTime()
}

/**
 * Get the start of the week (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

/**
 * Get the end of the week (Saturday)
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000)
}

/**
 * Filter lessons for current week and sort by scheduled time
 */
export function filterCurrentWeekLessons<T extends { scheduledTime: number }>(
  lessons: T[]
): T[] {
  return lessons
    .filter(lesson => isLessonInCurrentWeek(lesson.scheduledTime))
    .sort((a, b) => a.scheduledTime - b.scheduledTime)
}

/**
 * Get upcoming lessons (future lessons only)
 */
export function getUpcomingLessons<T extends { scheduledTime: number }>(
  lessons: T[]
): T[] {
  const now = Date.now()
  return lessons
    .filter(lesson => lesson.scheduledTime > now)
    .sort((a, b) => a.scheduledTime - b.scheduledTime)
}