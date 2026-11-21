import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-surface shadow-card', className)}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  id?: string
}

export function CardHeader({ title, description, actions, className, id }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-semibold text-navy">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
