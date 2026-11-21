import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPoints, formatSignedPercent } from '@/lib/format'

interface ChangeBadgeProps {
  value: number
  unit?: 'pp' | 'percent'
  /** For inflation, a rise is unfavourable and shown in red. */
  higherIsWorse?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function changeTone(value: number, higherIsWorse = true) {
  if (Math.abs(value) < 0.005) return 'neutral' as const
  const isUp = value > 0
  return isUp === higherIsWorse ? ('negative' as const) : ('positive' as const)
}

export function ChangeBadge({ value, unit = 'pp', higherIsWorse = true, size = 'sm', className }: ChangeBadgeProps) {
  const tone = changeTone(value, higherIsWorse)
  const Icon = Math.abs(value) < 0.005 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight
  const label = unit === 'pp' ? formatPoints(value) : formatSignedPercent(value)

  return (
    <span
      className={cn(
        'num inline-flex items-center gap-0.5 rounded-md font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        tone === 'negative' && 'bg-up-soft text-up',
        tone === 'positive' && 'bg-down-soft text-down',
        tone === 'neutral' && 'bg-surface-muted text-muted',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden="true" />
      {label}
    </span>
  )
}
