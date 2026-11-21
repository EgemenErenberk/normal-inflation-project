/**
 * Domain types shared by the UI and the service layer.
 * Shapes mirror the expected FastAPI response schemas so the mock
 * implementation can be swapped for real HTTP calls without UI changes.
 */

/** ISO month string, e.g. "2026-10" */
export type YearMonth = string

/** ISO date string, e.g. "2026-10-15" */
export type IsoDate = string

export type DateRangePreset = '6M' | '1Y' | '2Y' | '3Y' | 'ALL'

export interface DateRange {
  preset: DateRangePreset
  start: YearMonth
  end: YearMonth
}

export interface InflationPoint {
  period: YearMonth
  /** Month-over-month change, % */
  monthly: number
  /** Year-over-year change, % */
  annual: number
  /** Index level, base period = 100 */
  index: number
}

export interface KpiMetric {
  id: 'cumulative' | 'monthly' | 'annual' | 'tracked-products'
  label: string
  value: number
  unit: 'percent' | 'count'
  /** Change versus the comparison period (percentage points for rates, % for counts) */
  change: number | null
  changeUnit: 'pp' | 'percent'
  comparisonLabel: string
  trend: number[]
  /** When true, an increase is unfavourable (e.g. inflation rates) */
  higherIsWorse: boolean
}

export interface InflationSummary {
  asOf: YearMonth
  lastUpdated: IsoDate
  isDemo: boolean
  metrics: KpiMetric[]
}

export type CoicopCode =
  | '01' | '02' | '03' | '04' | '05' | '06' | '07'
  | '08' | '09' | '10' | '11' | '12' | '13'

export interface CoicopCategory {
  code: CoicopCode
  name: string
  shortName: string
  /** Basket weight, % of total */
  weight: number
}

export interface CategoryInflation extends CoicopCategory {
  monthly: number
  annual: number
  /** Annual rate change vs previous month, percentage points */
  annualChange: number
  /** Contribution to headline annual inflation, percentage points */
  contribution: number
  trend: number[]
}

export interface CategoryDetail extends CategoryInflation {
  series: InflationPoint[]
  subcategories: { code: string; name: string; annual: number; weight: number }[]
}

export interface Retailer {
  id: string
  name: string
  channel: 'Mağaza' | 'Çevrim içi' | 'Mağaza + Çevrim içi'
}

export interface PriceObservation {
  date: IsoDate
  price: number
}

export interface ProductPrice {
  /** Stable product identifier – primary key for index calculation */
  productId: string
  /** COICOP 2018 subclass code, e.g. "01.1.1.1" */
  coicopCode: string
  categoryCode: CoicopCode
  retailerId: string
  retailerName: string
  city: string | null
  /** Optional display label; not used for identification */
  displayName: string | null
  unit: string
  date: IsoDate
  price: number
  firstPrice: number
  /** % change from first observation in range */
  change: number
}

export interface ProductHistory {
  productId: string
  coicopCode: string
  retailerName: string
  city: string | null
  displayName: string | null
  unit: string
  observations: PriceObservation[]
}

export interface PriceQuery {
  range: DateRange
  retailerId?: string
  categoryCode?: CoicopCode
  city?: string
  search?: string
}

export type SourceStatus = 'active' | 'delayed' | 'error' | 'paused'

export interface DataSource {
  id: string
  name: string
  type: 'Web kazıma' | 'API' | 'Resmi istatistik' | 'Dosya aktarımı'
  retailers: string[]
  lastSuccess: string
  recordCount: number
  coverage: number
  status: SourceStatus
  frequency: string
}

export interface PlatformMeta {
  lastUpdated: string
  dataThrough: YearMonth
  firstPeriod: YearMonth
  isDemo: boolean
}
