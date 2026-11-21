import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border/70', className)} aria-hidden="true" />
}

interface StateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-subtle">
        <Inbox className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-navy">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  error?: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.'
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-up-soft text-up">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-navy">Veriler yüklenemedi</p>
      <p className="max-w-sm text-xs text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-navy hover:bg-surface-muted"
        >
          <RotateCw className="size-3.5" aria-hidden="true" />
          Tekrar dene
        </button>
      )}
    </div>
  )
}
