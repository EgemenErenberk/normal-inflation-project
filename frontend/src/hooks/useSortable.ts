import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

export function useSortable<T, K extends string>(
  rows: T[] | undefined,
  accessors: Record<K, (row: T) => string | number | null>,
  initial: SortState<K>,
) {
  const [sort, setSort] = useState<SortState<K>>(initial)

  const sorted = useMemo(() => {
    if (!rows) return []
    const get = accessors[sort.key]
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = get(a)
      const bv = get(b)
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv), 'tr-TR') * factor
    })
    // accessors are expected to be stable module-level definitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])

  const toggle = (key: K) =>
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    )

  return { sorted, sort, toggle }
}
