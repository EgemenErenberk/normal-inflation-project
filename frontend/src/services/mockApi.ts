import { env } from '@/config/env'
import { addMonths, monthsBetween, round } from '@/lib/utils'
import type {
  CategoryInflation,
  DateRange,
  InflationPoint,
  KpiMetric,
  ProductPrice,
} from '@/types'
import {
  COICOP_CATEGORIES,
  categorySeries,
  getSubcategories,
} from '@/mocks/categories'
import {
  DATA_THROUGH,
  FIRST_ANNUAL_PERIOD,
  LAST_UPDATED,
  TRACKED_PRODUCT_COUNT,
  TRACKED_PRODUCT_COUNT_PREV,
  headlineSeries,
  seriesStart,
} from '@/mocks/inflation'
import { CITIES, PRODUCT_PANELS, RETAILERS, periodToObservationDate } from '@/mocks/products'
import { DATA_SOURCES } from '@/mocks/sources'
import type { InflationApi } from './types'

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), env.mockLatencyMs))
}

function sliceRange(series: InflationPoint[], range: DateRange) {
  return series.filter((p) => p.period >= range.start && p.period <= range.end)
}

function cumulative(points: InflationPoint[]) {
  return round((points.reduce((acc, p) => acc * (1 + p.monthly / 100), 1) - 1) * 100, 2)
}

function buildCategoryRows(range: DateRange): CategoryInflation[] {
  const headline = sliceRange(headlineSeries, range)
  const headlineAnnual = headline.at(-1)?.annual ?? 0
  const rows = COICOP_CATEGORIES.map((cat) => {
    const series = sliceRange(categorySeries[cat.code], range)
    const last = series.at(-1)
    const prev = series.at(-2)
    return {
      ...cat,
      monthly: last?.monthly ?? 0,
      annual: last?.annual ?? 0,
      annualChange: round((last?.annual ?? 0) - (prev?.annual ?? last?.annual ?? 0), 2),
      contribution: round(((last?.annual ?? 0) * cat.weight) / 100, 2),
      trend: series.slice(-12).map((p) => p.annual),
    }
  })
  const totalContribution = rows.reduce((s, r) => s + r.contribution, 0)
  // Scale contributions so they sum to the headline rate for display consistency.
  const scale = totalContribution ? headlineAnnual / totalContribution : 1
  return rows.map((r) => ({ ...r, contribution: round(r.contribution * scale, 2) }))
}

export const mockApi: InflationApi = {
  getMeta: () =>
    delay({
      lastUpdated: LAST_UPDATED,
      dataThrough: DATA_THROUGH,
      firstPeriod: FIRST_ANNUAL_PERIOD,
      isDemo: true,
    }),

  getSummary(range) {
    const points = sliceRange(headlineSeries, range)
    const last = points.at(-1)!
    const prev = points.at(-2) ?? last
    const prevRange = {
      ...range,
      start: addMonths(range.start, -1),
      end: addMonths(range.end, -1),
    }
    const prevCumulative = cumulative(sliceRange(headlineSeries, prevRange))
    const currentCumulative = cumulative(points)
    const trend12 = points.slice(-12)

    const metrics: KpiMetric[] = [
      {
        id: 'cumulative',
        label: 'Genel Enflasyon',
        value: currentCumulative,
        unit: 'percent',
        change: round(currentCumulative - prevCumulative, 2),
        changeUnit: 'pp',
        comparisonLabel: 'Seçili dönem kümülatif',
        trend: trend12.map((p) => p.index),
        higherIsWorse: true,
      },
      {
        id: 'monthly',
        label: 'Aylık Enflasyon',
        value: last.monthly,
        unit: 'percent',
        change: round(last.monthly - prev.monthly, 2),
        changeUnit: 'pp',
        comparisonLabel: 'Önceki aya göre',
        trend: trend12.map((p) => p.monthly),
        higherIsWorse: true,
      },
      {
        id: 'annual',
        label: 'Yıllık Enflasyon',
        value: last.annual,
        unit: 'percent',
        change: round(last.annual - prev.annual, 2),
        changeUnit: 'pp',
        comparisonLabel: 'Önceki aya göre',
        trend: trend12.map((p) => p.annual),
        higherIsWorse: true,
      },
      {
        id: 'tracked-products',
        label: 'Takip Edilen Ürün',
        value: TRACKED_PRODUCT_COUNT,
        unit: 'count',
        change: round(((TRACKED_PRODUCT_COUNT - TRACKED_PRODUCT_COUNT_PREV) / TRACKED_PRODUCT_COUNT_PREV) * 100, 2),
        changeUnit: 'percent',
        comparisonLabel: 'Önceki aya göre',
        trend: [41.2, 41.9, 42.6, 43.1, 43.8, 44.2, 44.9, 45.3, 45.8, 46.4, 47.1, 48.3],
        higherIsWorse: false,
      },
    ]

    return delay({ asOf: last.period, lastUpdated: LAST_UPDATED, isDemo: true, metrics })
  },

  getTrend: (range) => delay(sliceRange(headlineSeries, range)),

  getCategories: (range) => delay(buildCategoryRows(range).sort((a, b) => a.code.localeCompare(b.code))),

  getCategory(code, range) {
    const row = buildCategoryRows(range).find((r) => r.code === code)
    if (!row) return Promise.reject(new Error('Kategori bulunamadı'))
    return delay({
      ...row,
      series: sliceRange(categorySeries[code], range),
      subcategories: getSubcategories(code, row.annual),
    })
  },

  getRetailers: () => delay(RETAILERS),

  getCities: () => delay(CITIES),

  getPrices({ range, retailerId, categoryCode, city, search }) {
    const startIdx = Math.max(0, monthsBetween(seriesStart, range.start))
    const endIdx = monthsBetween(seriesStart, range.end)
    const q = search?.trim().toLocaleLowerCase('tr-TR')

    const rows: ProductPrice[] = PRODUCT_PANELS.filter((p) => {
      if (retailerId && p.retailerId !== retailerId) return false
      if (categoryCode && p.categoryCode !== categoryCode) return false
      if (city && p.city !== city) return false
      if (q) {
        const haystack = `${p.productId} ${p.coicopCode} ${p.displayName ?? ''}`.toLocaleLowerCase('tr-TR')
        if (!haystack.includes(q)) return false
      }
      return true
    }).map((p) => {
      const first = p.prices[startIdx]
      const latest = p.prices[endIdx]
      return {
        productId: p.productId,
        coicopCode: p.coicopCode,
        categoryCode: p.categoryCode,
        retailerId: p.retailerId,
        retailerName: p.retailerName,
        city: p.city,
        displayName: p.displayName,
        unit: p.unit,
        date: periodToObservationDate(range.end, p.productId),
        price: latest,
        firstPrice: first,
        change: round(((latest - first) / first) * 100, 2),
      }
    })

    return delay(rows)
  },

  getProductHistory(productId, range) {
    const panel = PRODUCT_PANELS.find((p) => p.productId === productId)
    if (!panel) return Promise.reject(new Error('Ürün bulunamadı'))
    const startIdx = Math.max(0, monthsBetween(seriesStart, range.start))
    const endIdx = monthsBetween(seriesStart, range.end)
    const observations = panel.prices.slice(startIdx, endIdx + 1).map((price, i) => ({
      date: periodToObservationDate(addMonths(range.start, i), panel.productId),
      price,
    }))
    return delay({
      productId: panel.productId,
      coicopCode: panel.coicopCode,
      retailerName: panel.retailerName,
      city: panel.city,
      displayName: panel.displayName,
      unit: panel.unit,
      observations,
    })
  },

  getDataSources: () => delay(DATA_SOURCES),
}
