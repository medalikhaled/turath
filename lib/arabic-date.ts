// Arabic month names
const ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

// Arabic day names
const ARABIC_DAYS = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
]

// Arabic numerals
const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toArabicNumerals(num: number): string {
  return num.toString().split('').map(digit => ARABIC_NUMERALS[parseInt(digit)] || digit).join('')
}

export function formatArabicDate(timestamp: number, options?: {
  includeTime?: boolean
  includeDay?: boolean
  shortMonth?: boolean
}): string {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()
  const dayOfWeek = date.getDay()
  
  const { includeTime = false, includeDay = true, shortMonth = false } = options || {}
  
  let result = ''
  
  // Add day of week
  if (includeDay) {
    result += ARABIC_DAYS[dayOfWeek] + ' '
  }
  
  // Add date
  result += `${toArabicNumerals(day)} ${ARABIC_MONTHS[month]} ${toArabicNumerals(year)}`
  
  // Add time if requested
  if (includeTime) {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const timeStr = `${toArabicNumerals(hours)}:${toArabicNumerals(minutes).padStart(2, '٠')}`
    result += ` - ${timeStr}`
  }
  
  return result
}

export function formatArabicTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  
  return `${toArabicNumerals(hours)}:${toArabicNumerals(minutes).padStart(2, '٠')}`
}

export function formatArabicDayHeader(timestamp: number): string {
  const date = new Date(timestamp)
  const day = date.getDate()
  const month = date.getMonth()
  const dayOfWeek = date.getDay()
  
  return `${ARABIC_DAYS[dayOfWeek]} ${toArabicNumerals(day)} ${ARABIC_MONTHS[month]}`
}