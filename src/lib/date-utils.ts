/**
 * Utility functions for handling dates consistently across the app
 * Addresses timezone issues when working with date-only strings vs full timestamps
 */

/**
 * Safely parse a date string, handling both date-only and full timestamp formats
 * For date-only strings, adds noon time to avoid timezone shifting issues
 */
export function safeParseDateString(dateString: string): Date {
  if (dateString.includes('T')) {
    return new Date(dateString)
  }
  // For date-only strings, append noon time to avoid timezone issues
  return new Date(dateString + 'T12:00:00')
}

/**
 * Get the date portion of a date string in YYYY-MM-DD format
 */
export function getDatePortion(dateString: string): string {
  return dateString.includes('T') 
    ? dateString.split('T')[0] 
    : dateString
}

/**
 * Format a date string as a relative date (Today, Yesterday, or formatted date)
 */
export function formatRelativeDate(dateString: string): string {
  const date = safeParseDateString(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Compare date strings to avoid timezone issues
  const dateStr = date.toDateString()
  const todayStr = today.toDateString()
  const yesterdayStr = yesterday.toDateString()

  if (dateStr === todayStr) {
    return 'Today'
  } else if (dateStr === yesterdayStr) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

/**
 * Format a date string for chart display
 */
export function formatChartDate(dateString: string): string {
  const date = safeParseDateString(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Get today's date in YYYY-MM-DD format in user's local timezone
 * This is what the user sees and interacts with
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in user's local timezone (alias for clarity)
 */
export function getTodayLocalDate(): string {
  return getTodayDateString()
}

/**
 * Format a date string for display in user's local timezone
 */
export function formatDateForDisplay(dateString: string): string {
  return safeParseDateString(dateString).toLocaleDateString()
}

/**
 * Format a date string as a readable date with day of week
 */
export function formatDateWithDay(dateString: string): string {
  return safeParseDateString(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Check if a date string represents today (local date comparison)
 */
export function isToday(dateString: string): boolean {
  const today = getTodayLocalDate()
  const dateOnly = getDatePortion(dateString)
  return today === dateOnly
}

/**
 * Convert UTC timestamp to local timezone for display
 * Assumes input timestamp is in UTC (as stored in database)
 */
export function formatUTCTimestampToLocal(utcTimestamp: string): string {
  const utcDate = new Date(utcTimestamp)
  return utcDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Convert UTC timestamp to local time only (no date)
 */
export function formatUTCTimeToLocal(utcTimestamp: string): string {
  const utcDate = new Date(utcTimestamp)
  return utcDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get the local date portion of a UTC timestamp in YYYY-MM-DD format
 * This converts UTC to local timezone first, then extracts the date
 */
export function getLocalDateFromUTC(utcTimestamp: string): string {
  const utcDate = new Date(utcTimestamp)
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}

/**
 * Check if a UTC timestamp represents today in the user's local timezone
 */
export function isUTCTimestampToday(utcTimestamp: string): boolean {
  const localDateFromUTC = getLocalDateFromUTC(utcTimestamp)
  const todayLocal = getTodayLocalDate()
  return localDateFromUTC === todayLocal
}

/**
 * Check if a UTC timestamp falls on a specific local date
 */
export function isLocalDate(utcTimestamp: string, localDate: string): boolean {
  const localDateFromUTC = getLocalDateFromUTC(utcTimestamp)
  return localDateFromUTC === localDate
}

/**
 * Convert a local date (YYYY-MM-DD) to UTC timestamp range for database queries
 * Returns start and end UTC timestamps that capture all times on that local date
 */
export function getLocalDateRangeForQuery(localDate: string): { start: string, end: string } {
  // Create Date objects at the start and end of the local date
  const startOfLocalDay = new Date(localDate + 'T00:00:00') // Local midnight
  const endOfLocalDay = new Date(localDate + 'T23:59:59.999') // Local end of day
  
  // Convert to UTC timestamps for database queries
  const start = startOfLocalDay.toISOString()
  const end = endOfLocalDay.toISOString()
  
  return { start, end }
}

/**
 * Check if a UTC timestamp represents the current local date
 */
export function isLocalToday(utcTimestamp: string): boolean {
  return isLocalDate(utcTimestamp, getTodayLocalDate())
}