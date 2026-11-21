import { env } from '@/config/env'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | boolean | undefined | null

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const url = new URL(`${base}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

export async function apiGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string }
      if (body.detail) detail = body.detail
    } catch {
      // Non-JSON error body; keep status text.
    }
    throw new ApiError(detail || 'İstek başarısız oldu', response.status)
  }
  return (await response.json()) as T
}
