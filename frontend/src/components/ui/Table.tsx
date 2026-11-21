import type { ReactNode, ThHTMLAttributes } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortState } from '@/hooks/useSortable'

interface SortableHeaderProps<K extends string> extends ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  align?: 'left' | 'right'
  children: ReactNode
}

export function SortableHeader<K extends string>({
  sortKey,
  sort,
  onSort,
  align = 'left',
  children,
  className,
  ...props
}: SortableHeaderProps<K>) {
  const active = sort.key === sortKey
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-2.5 font-medium', align === 'right' && 'text-right', className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 rounded hover:text-navy',
          align === 'right' && 'flex-row-reverse',
          active && 'text-navy',
        )}
      >
        {children}
        <Icon className={cn('size-3', !active && 'opacity-40')} aria-hidden="true" />
      </button>
    </th>
  )
}

export const tableHeadClass =
  'border-b border-border bg-surface-muted text-[11px] uppercase tracking-wide text-subtle'
export const tableRowClass = 'border-b border-border last:border-0'
