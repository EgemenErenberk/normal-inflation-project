import { env } from '@/config/env'
import { httpApi } from './httpApi'
import { mockApi } from './mockApi'
import type { InflationApi } from './types'

export const api: InflationApi = env.useMockData ? mockApi : httpApi
export const isUsingMockData = env.useMockData

export { ApiError } from './apiClient'
export type { InflationApi } from './types'
