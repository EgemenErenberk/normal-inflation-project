import type { InflationPoint } from '@/types'
import { addMonths, round } from '@/lib/utils'

/** DEMO DATA – illustrative monthly CPI changes (%), loosely shaped on public trends. */
const SERIES_START = '2021-01'

const MONTHLY_HEADLINE: number[] = [
  // 2021
  1.68, 0.91, 1.08, 1.68, 0.89, 1.94, 1.8, 1.12, 1.25, 2.39, 3.51, 13.58,
  // 2022
  11.1, 4.81, 5.46, 7.25, 2.98, 4.95, 2.37, 1.46, 3.08, 3.54, 2.88, 1.18,
  // 2023
  6.65, 3.15, 2.29, 2.39, 0.04, 3.92, 9.49, 9.09, 4.75, 3.43, 3.28, 2.93,
  // 2024
  6.7, 4.53, 3.16, 3.18, 3.37, 1.64, 3.23, 2.47, 2.97, 2.88, 2.24, 1.03,
  // 2025
  5.03, 2.27, 2.46, 3.0, 1.53, 1.37, 2.06, 2.04, 3.23, 2.55, 0.87, 0.89,
  // 2026 (Jan – Oct)
  4.1, 2.05, 1.95, 2.4, 1.3, 1.25, 2.1, 1.6, 2.2, 1.9,
]

export const DATA_THROUGH = addMonths(SERIES_START, MONTHLY_HEADLINE.length - 1)
/** First month with a full 12-month look-back */
export const FIRST_ANNUAL_PERIOD = addMonths(SERIES_START, 12)
export const LAST_UPDATED = '2026-11-03T10:00:00+03:00'
export const TRACKED_PRODUCT_COUNT = 48_312
export const TRACKED_PRODUCT_COUNT_PREV = 47_085

export function buildSeries(monthly: number[], start = SERIES_START): InflationPoint[] {
  const points: InflationPoint[] = []
  let index = 100
  monthly.forEach((m, i) => {
    index *= 1 + m / 100
    let annual = NaN
    if (i >= 12) {
      const window = monthly.slice(i - 11, i + 1)
      annual = (window.reduce((acc, v) => acc * (1 + v / 100), 1) - 1) * 100
    }
    points.push({
      period: addMonths(start, i),
      monthly: round(m, 2),
      annual: round(annual, 2),
      index: round(index, 2),
    })
  })
  return points.filter((p) => !Number.isNaN(p.annual))
}

export const headlineMonthly = MONTHLY_HEADLINE
export const headlineSeries = buildSeries(MONTHLY_HEADLINE)
export const seriesStart = SERIES_START
