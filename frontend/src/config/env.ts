/**
 * Central runtime configuration.
 *
 * VITE_API_BASE_URL  – FastAPI base URL, e.g. http://localhost:8000/api/v1
 * VITE_USE_MOCK_DATA – "false" to call the real API; defaults to mock data.
 */
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1',
  useMockData: (import.meta.env.VITE_USE_MOCK_DATA as string | undefined) !== 'false',
  mockLatencyMs: 350,
} as const
