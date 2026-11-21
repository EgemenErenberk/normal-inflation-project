import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { api } from '@/services'
import { addMonths } from '@/lib/utils'
import type { DateRange, DateRangePreset, PlatformMeta } from '@/types'

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string; months: number | null }[] = [
  { value: '6M', label: '6A', months: 6 },
  { value: '1Y', label: '1Y', months: 12 },
  { value: '2Y', label: '2Y', months: 24 },
  { value: '3Y', label: '3Y', months: 36 },
  { value: 'ALL', label: 'Tümü', months: null },
]

export const PRESET_DESCRIPTIONS: Record<DateRangePreset, string> = {
  '6M': 'Son 6 ay',
  '1Y': 'Son 12 ay',
  '2Y': 'Son 24 ay',
  '3Y': 'Son 36 ay',
  ALL: 'Tüm dönem',
}

interface DateRangeContextValue {
  preset: DateRangePreset
  setPreset: (preset: DateRangePreset) => void
  range: DateRange | null
  meta: PlatformMeta | undefined
  metaError: unknown
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

function resolveRange(preset: DateRangePreset, meta: PlatformMeta): DateRange {
  const def = DATE_RANGE_PRESETS.find((p) => p.value === preset)!
  const end = meta.dataThrough
  let start = def.months ? addMonths(end, -(def.months - 1)) : meta.firstPeriod
  if (start < meta.firstPeriod) start = meta.firstPeriod
  return { preset, start, end }
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<DateRangePreset>('1Y')
  const { data: meta, error: metaError } = useSWR('meta', () => api.getMeta())

  const value = useMemo<DateRangeContextValue>(
    () => ({
      preset,
      setPreset,
      range: meta ? resolveRange(preset, meta) : null,
      meta,
      metaError,
    }),
    [preset, meta, metaError],
  )

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext)
  if (!ctx) throw new Error('useDateRange must be used inside DateRangeProvider')
  return ctx
}
