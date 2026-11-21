const LOCALE = 'tr-TR'

const numberFormatters = new Map<string, Intl.NumberFormat>()

function getNumberFormatter(min: number, max: number) {
  const key = `${min}-${max}`
  let formatter = numberFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    })
    numberFormatters.set(key, formatter)
  }
  return formatter
}

export function formatNumber(value: number, digits = 0) {
  return getNumberFormatter(digits, digits).format(value)
}

/** Turkish convention puts the percent sign first: %2,45 */
export function formatPercent(value: number, digits = 2) {
  const abs = getNumberFormatter(digits, digits).format(Math.abs(value))
  return `${value < 0 ? '−' : ''}%${abs}`
}

export function formatSignedPercent(value: number, digits = 2) {
  if (value === 0) return formatPercent(0, digits)
  const abs = getNumberFormatter(digits, digits).format(Math.abs(value))
  return `${value > 0 ? '+' : '−'}%${abs}`
}

export function formatPoints(value: number, digits = 2) {
  const abs = getNumberFormatter(digits, digits).format(Math.abs(value))
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${abs} puan`
}

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCompact(value: number) {
  return compactFormatter.format(value)
}

const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' })
const monthLong = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function parseYearMonth(period: string) {
  const [y, m] = period.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 15))
}

export function formatPeriod(period: string, style: 'short' | 'long' = 'short') {
  return (style === 'short' ? monthShort : monthLong).format(parseYearMonth(period))
}

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso))
}
