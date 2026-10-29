/**
 * Time utility functions for 12-hour AM/PM and 24-hour transit timetable formats.
 */

export function formatTime12(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return time24

  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  const displayMin = m.toString().padStart(2, '0')
  return `${displayHour}:${displayMin} ${period}`
}

export function toTime24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12 % 12
  if (period === 'PM') h += 12
  return `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export function parseToTime24(input: string): string | null {
  const trimmed = input.trim()
  const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (match12) {
    let hour = parseInt(match12[1], 10)
    const min = match12[2] ? parseInt(match12[2], 10) : 0
    const period = match12[3].toUpperCase()
    if (hour < 1 || hour > 12 || min < 0 || min > 59) return null
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }

  const match24 = trimmed.match(/^([0-3]?\d|4[0-7]):([0-5]\d)$/)
  if (match24) {
    const hour = parseInt(match24[1], 10)
    const min = parseInt(match24[2], 10)
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }

  return null
}
