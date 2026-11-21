import type { DateRange } from '@/types'
import { apiGet } from './apiClient'
import type { InflationApi } from './types'

const rangeParams = (range: DateRange) => ({ start: range.start, end: range.end })

/**
 * FastAPI implementation. Endpoint paths are the agreed contract;
 * adjust here only if the backend routes differ.
 */
export const httpApi: InflationApi = {
  getMeta: () => apiGet('/meta'),
  getSummary: (range) => apiGet('/inflation/summary', rangeParams(range)),
  getTrend: (range) => apiGet('/inflation/trend', rangeParams(range)),
  getCategories: (range) => apiGet('/categories', rangeParams(range)),
  getCategory: (code, range) => apiGet(`/categories/${code}`, rangeParams(range)),
  getRetailers: () => apiGet('/retailers'),
  getCities: () => apiGet('/cities'),
  getPrices: ({ range, retailerId, categoryCode, city, search }) =>
    apiGet('/prices', {
      ...rangeParams(range),
      retailer_id: retailerId,
      category: categoryCode,
      city,
      q: search,
    }),
  getProductHistory: (productId, range) =>
    apiGet(`/products/${encodeURIComponent(productId)}/history`, rangeParams(range)),
  getDataSources: () => apiGet('/sources'),
}
