import dayjs from '@/lib/dayjs'
import { isPersian, localizeDigits } from '@/lib/numerals'
import { useTranslation } from 'react-i18next'

// Helper function to convert timestamp to ISO string
function timestampToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

// Helper function to convert ISO string to timestamp
function isoToTimestamp(isoString: string): number {
  return Math.floor(new Date(isoString).getTime() / 1000)
}

export const useRelativeExpiryDate = (expiryDate: string | number | null | undefined) => {
  const { t } = useTranslation()
  const dateInfo = { status: '', time: '', isExpired: false }

  if (!expiryDate) return dateInfo

  const target = dateUtils.toDayjs(expiryDate)
  const now = dayjs()

  const isAfter = target.isAfter(now)
  dateInfo.status = isAfter ? t('expires') : t('expired')
  dateInfo.isExpired = !isAfter

  const duration = dayjs.duration(target.diff(now))
  const durationSlots: string[] = []

  const years = Math.abs(duration.years())
  const months = Math.abs(duration.months())
  const days = Math.abs(duration.days())
  const hours = Math.abs(duration.hours())
  const minutes = Math.abs(duration.minutes())

  if (years > 0) {
    durationSlots.push(`${years} ${t(`time.${years !== 1 ? 'years' : 'year'}`)}`)
    // Also show months if there are any
    if (months > 0) {
      durationSlots.push(`${months} ${t(`time.${months !== 1 ? 'months' : 'month'}`)}`)
    }
  } else if (months > 0) {
    durationSlots.push(`${months} ${t(`time.${months !== 1 ? 'months' : 'month'}`)}`)
    // Also show days if there are any (and we're showing months)
    if (days > 0) {
      durationSlots.push(`${days} ${t(`time.${days !== 1 ? 'days' : 'day'}`)}`)
    }
  } else if (days > 0) {
    durationSlots.push(`${days} ${t(`time.${days !== 1 ? 'days' : 'day'}`)}`)
  }

  if (durationSlots.length === 0) {
    if (hours > 0) {
      durationSlots.push(`${hours} ${t(`time.${hours !== 1 ? 'hours' : 'hour'}`)}`)
    }

    if (minutes > 0 && hours === 0) {
      durationSlots.push(`${minutes} ${t(`time.${minutes !== 1 ? 'mins' : 'min'}`)}`)
    }
  }

  dateInfo.time = localizeDigits(durationSlots.join(isPersian() ? '، ' : ', ') + (isAfter ? '' : ` ${t('time.ago')}`))
  return dateInfo
}

// Used within this window counts as "online / connection working".
// The header badge and the Connect panel both use it, so they never disagree.
export const ONLINE_WINDOW_MS = 10 * 60 * 1000

// Format time ago for online status
export const formatTimeAgo = (
  dateString: string | null | undefined,
  t: (key: string) => string
): { text: string; isOnline: boolean } => {
  if (!dateString) {
    return { text: t('notConnectedYet'), isOnline: false }
  }

  const lastOnlineTime = dateUtils.toDayjs(dateString)
  const now = dayjs()
  const diffInSeconds = Math.abs(now.diff(lastOnlineTime, 'second'))

  const isOnline = diffInSeconds * 1000 <= ONLINE_WINDOW_MS

  if (isOnline) {
    return { text: t('online'), isOnline: true }
  }

  const duration = dayjs.duration(now.diff(lastOnlineTime))

  let timeText = ''

  const years = Math.abs(duration.years())
  const months = Math.abs(duration.months())
  const days = Math.abs(duration.days())
  const hours = Math.abs(duration.hours())
  const minutes = Math.abs(duration.minutes())
  const seconds = Math.abs(duration.seconds())

  if (years > 0) {
    timeText = `${years} ${t(`time.${years !== 1 ? 'years' : 'year'}`)} ${t('time.ago')}`
  } else if (months > 0) {
    timeText = `${months} ${t(`time.${months !== 1 ? 'months' : 'month'}`)} ${t('time.ago')}`
  } else if (days > 0) {
    timeText = `${days} ${t(`time.${days !== 1 ? 'days' : 'day'}`)} ${t('time.ago')}`
  } else if (hours > 0) {
    timeText = `${hours} ${t(`time.${hours !== 1 ? 'hours' : 'hour'}`)} ${t('time.ago')}`
  } else if (minutes > 0) {
    timeText = `${minutes} ${t(`time.${minutes !== 1 ? 'mins' : 'min'}`)} ${t('time.ago')}`
  } else {
    timeText = `${seconds} ${t(`time.${seconds !== 1 ? 'seconds' : 'second'}`)} ${t('time.ago')}`
  }

  return { text: localizeDigits(timeText), isOnline: false }
}

// Format relative expiry for standalone use
export const formatRelativeExpiry = (
  expiryDate: string | number | null | undefined,
  t: (key: string) => string
): { status: string; time: string; isExpired: boolean } => {
  if (!expiryDate || expiryDate === 0) {
    return { status: t('userInfo.timeLeft'), time: t('userInfo.unlimited'), isExpired: false }
  }

  const target = dateUtils.toDayjs(expiryDate)
  const now = dayjs()

  const isAfter = target.isAfter(now)
  const status = isAfter ? t('expires') : t('expired')

  const duration = dayjs.duration(target.diff(now))
  const durationSlots: string[] = []

  const years = Math.abs(duration.years())
  const months = Math.abs(duration.months())
  const days = Math.abs(duration.days())
  const hours = Math.abs(duration.hours())
  const minutes = Math.abs(duration.minutes())

  // Under a month left: whole days, rounded up, so 1.9 days reads "2 days"
  const diffMs = Math.abs(target.diff(now))
  const ceilDays = Math.ceil(diffMs / 864e5)
  if (isAfter && years === 0 && months === 0 && diffMs >= 864e5) {
    durationSlots.push(`${ceilDays} ${t(`time.${ceilDays !== 1 ? 'days' : 'day'}`)}`)
  } else if (years > 0) {
    durationSlots.push(`${years} ${t(`time.${years !== 1 ? 'years' : 'year'}`)}`)
    // Also show months if there are any
    if (months > 0) {
      durationSlots.push(`${months} ${t(`time.${months !== 1 ? 'months' : 'month'}`)}`)
    }
  } else if (months > 0) {
    durationSlots.push(`${months} ${t(`time.${months !== 1 ? 'months' : 'month'}`)}`)
    // Also show days if there are any (and we're showing months)
    if (days > 0) {
      durationSlots.push(`${days} ${t(`time.${days !== 1 ? 'days' : 'day'}`)}`)
    }
  } else if (days > 0) {
    durationSlots.push(`${days} ${t(`time.${days !== 1 ? 'days' : 'day'}`)}`)
  }

  if (durationSlots.length === 0) {
    if (hours > 0) {
      durationSlots.push(`${hours} ${t(`time.${hours !== 1 ? 'hours' : 'hour'}`)}`)
    }

    if (minutes > 0 && hours === 0) {
      durationSlots.push(`${minutes} ${t(`time.${minutes !== 1 ? 'mins' : 'min'}`)}`)
    }
  }

  const time = localizeDigits(durationSlots.join(isPersian() ? '، ' : ', ') + (isAfter ? '' : ` ${t('time.ago')}`))
  
  return { status, time, isExpired: !isAfter }
}

// Format date for display
export const formatDate = (
  dateString: string | null | undefined,
  locale?: string,
  withTime: boolean = true
): string => {
  if (!dateString) return ''

  const d = dateUtils.toDayjs(dateString)
  const time = withTime ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}

  if (locale === 'fa-IR') {
    // "۱۱ آبان ۱۴۰۵": month by name, the way people write dates
    return d.toDate().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...time,
    }).replace(', ', '، ') // Persian comma between date and time
  }

  // Other languages: the browser's own date format for that language
  try {
    return d.toDate().toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...time,
      hour12: false,
    })
  } catch {
    return d.format('MMM D, YYYY HH:mm')
  }
}

// Export helper functions for use in other components
export const dateUtils = {
  timestampToISO,
  isoToTimestamp,

  getCurrentISOTime: () => {
    return dayjs().toISOString() // ISO in UTC (standard)
  },

  formatDate: (date: string | number | Date) => {
    const d = typeof date === 'string' ? dayjs.utc(date).local() : typeof date === 'number' ? dayjs.unix(date).local() : dayjs(date).local()

    return d.format('YYYY-MM-DD HH:mm:ss')
  },

  toDayjs: (date: string | number | Date) => {
    return typeof date === 'string' ? dayjs.utc(date).local() : typeof date === 'number' ? dayjs.unix(date).local() : dayjs(date).local()
  },

  isValidDate: (date: string | number | Date) => {
    const d = typeof date === 'string' ? new Date(date) : typeof date === 'number' ? new Date(date * 1000) : date

    return !isNaN(d.getTime())
  },

  daysToSeconds: (days: number | undefined): number | undefined => {
    if (days === undefined || days === null || days === 0) return undefined
    return Math.round(Number(days) * 24 * 60 * 60)
  },

  secondsToDays: (seconds: number | undefined): number | undefined => {
    if (seconds === undefined || seconds === null || seconds === 0) return undefined
    return Math.round(Number(seconds) / (24 * 60 * 60))
  },
}
