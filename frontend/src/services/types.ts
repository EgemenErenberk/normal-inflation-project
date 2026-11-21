import type {
  CategoryDetail,
  CategoryInflation,
  CoicopCode,
  DataSource,
  DateRange,
  InflationPoint,
  InflationSummary,
  PlatformMeta,
  PriceQuery,
  ProductHistory,
  ProductPrice,
  Retailer,
} from '@/types'

/** Contract implemented by both the mock and the FastAPI-backed service. */
export interface InflationApi {
  getMeta(): Promise<PlatformMeta>
  getSummary(range: DateRange): Promise<InflationSummary>
  getTrend(range: DateRange): Promise<InflationPoint[]>
  getCategories(range: DateRange): Promise<CategoryInflation[]>
  getCategory(code: CoicopCode, range: DateRange): Promise<CategoryDetail>
  getRetailers(): Promise<Retailer[]>
  getCities(): Promise<string[]>
  getPrices(query: PriceQuery): Promise<ProductPrice[]>
  getProductHistory(productId: string, range: DateRange): Promise<ProductHistory>
  getDataSources(): Promise<DataSource[]>
}
