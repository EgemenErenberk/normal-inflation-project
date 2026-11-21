import type { ReactNode, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
  title?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentedOption<T>[]
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex items-center rounded-lg border border-border bg-surface-muted p-0.5', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs',
              active ? 'bg-surface text-navy shadow-card ring-1 ring-border' : 'text-muted hover:text-navy',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={selectId} className="text-[11px] font-medium uppercase tracking-wide text-subtle">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className="h-9 w-full appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm text-ink hover:border-border-strong"
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-warn/20 bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn',
        className,
      )}
    >
      Demo veri
    </span>
  )
}
