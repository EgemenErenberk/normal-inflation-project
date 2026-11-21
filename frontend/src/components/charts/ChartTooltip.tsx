import type { ReactNode } from 'react'

export const CHART_COLORS = {
  navy: '#0b1f3a',
  accent: '#2453c4',
  up: '#b42318',
  down: '#12784a',
  grid: '#e9edf3',
  axis: '#8a98ab',
  muted: '#cfd7e2',
}

export const axisTickStyle = { fontSize: 11, fill: CHART_COLORS.axis, fontFamily: 'JetBrains Mono, monospace' }

export interface TooltipRow {
  label: string
  value: string
  color: string
}

interface ChartTooltipProps {
  active?: boolean
  title: ReactNode
  rows: TooltipRow[]
  footer?: ReactNode
}

export function ChartTooltip({ active, title, rows, footer }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null
  return (
    <div className="min-w-44 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-navy">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
              {row.label}
            </span>
            <span className="num font-medium text-ink">{row.value}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 border-t border-border pt-1.5 text-[11px] text-subtle">{footer}</div>}
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-4 text-xs text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={
              item.dashed
                ? { backgroundImage: `linear-gradient(90deg, ${item.color} 50%, transparent 50%)`, backgroundSize: '6px 2px' }
                : { backgroundColor: item.color }
            }
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
