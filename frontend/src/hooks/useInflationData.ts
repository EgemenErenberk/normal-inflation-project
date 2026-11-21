import useSWR from 'swr'
import { api } from '@/services'
import { useDateRange } from '@/context/DateRangeContext'
import type { CoicopCode, PriceQuery } from '@/types'

/**
 * Data hooks used by pages. Components never call the service directly,
 * so swapping mock data for FastAPI only touches the service layer.
 */

export function useSummary() {
  const { range } = useDateRange()
  return useSWR(range ? ['summary', range.start, range.end] : null, () => api.getSummary(range!))
}

export function useTrend() {
  const { range } = useDateRange()
  return useSWR(range ? ['trend', range.start, range.end] : null, () => api.getTrend(range!))
}

export function useCategories() {
  const { range } = useDateRange()
  return useSWR(range ? ['categories', range.start, range.end] : null, () => api.getCategories(range!))
}

export function useCategory(code: CoicopCode | undefined) {
  const { range } = useDateRange()
  return useSWR(range && code ? ['category', code, range.start, range.end] : null, () =>
    api.getCategory(code!, range!),
  )
}

export function useRetailers() {
  return useSWR('retailers', () => api.getRetailers())
}

export function useCities() {
  return useSWR('cities', () => api.getCities())
}

export function usePrices(filters: Omit<PriceQuery, 'range'>) {
  const { range } = useDateRange()
  return useSWR(
    range
      ? ['prices', range.start, range.end, filters.retailerId, filters.categoryCode, filters.city, filters.search]
      : null,
    () => api.getPrices({ ...filters, range: range! }),
    { keepPreviousData: true },
  )
}

export function useProductHistory(productId: string | null) {
  const { range } = useDateRange()
  return useSWR(range && productId ? ['history', productId, range.start, range.end] : null, () =>
    api.getProductHistory(productId!, range!),
  )
}

export function useDataSources() {
  return useSWR('sources', () => api.getDataSources())
}
