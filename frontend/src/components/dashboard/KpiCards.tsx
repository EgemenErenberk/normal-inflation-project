import { Activity, CalendarRange, Package, TrendingUp, type LucideIcon } from 'lucide-react'
import type { KpiMetric } from '@/types'
import { formatNumber, formatPercent, formatPeriod } from '@/lib/format'
import { useSummary } from '@/hooks/useInflationData'
import { useDateRange } from '@/context/DateRangeContext'
import { Card } from '@/components/ui/Card'
import { ChangeBadge, changeTone } from '@/components/ui/ChangeBadge'
import { DemoBadge } from '@/components/ui/Controls'
import { Sparkline } from '@/components/ui/Sparkline'
import { ErrorState, Skeleton } from '@/components/ui/States'

const ICONS: Record<KpiMetric['id'], LucideIcon> = {
  cumulative: TrendingUp,
  monthly: CalendarRange,
  annual: Activity,
  'tracked-products': Package,
}

const TONE_COLORS = {
  negative: 'var(--color-up)',
  positive: 'var(--color-down)',
  neutral: 'var(--color-navy)',
}

function KpiCard({ metric }: { metric: KpiMetric }) {
  const Icon = ICONS[metric.id]
  const tone = metric.change === null ? 'neutral' : changeTone(metric.change, metric.higherIsWorse)
  const value = metric.unit === 'percent' ? formatPercent(metric.value) : formatNumber(metric.value)

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-surface-muted text-navy ring-1 ring-border">
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <h3 className="text-xs font-medium text-muted">{metric.label}</h3>
        </div>
        <DemoBadge />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="num text-2xl font-semibold text-navy sm:text-[28px]">{value}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {metric.change !== null && (
              <ChangeBadge value={metric.change} unit={metric.changeUnit} higherIsWorse={metric.higherIsWorse} />
            )}
            <span className="text-[11px] text-subtle">{metric.comparisonLabel}</span>
          </div>
        </div>
        <Sparkline data={metric.trend} color={TONE_COLORS[tone]} className="shrink-0" />
      </div>
    </Card>
  )
}

export function KpiCards() {
  const { data, error, isLoading, mutate } = useSummary()
  const { range } = useDateRange()

  return (
    <section aria-labelledby="kpi-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="kpi-heading" className="text-sm font-semibold text-navy">
          Temel Göstergeler
        </h2>
        {data && range && (
          <p className="text-xs text-muted">
            Referans dönem: <span className="font-medium text-ink">{formatPeriod(data.asOf, 'long')}</span>
            {' · '}Aralık: <span className="num">{formatPeriod(range.start)} – {formatPeriod(range.end)}</span>
          </p>
        )}
      </div>

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={() => mutate()} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading || !data
            ? Array.from({ length: 4 }, (_, i) => (
                <Card key={i} className="flex flex-col gap-4 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-4 w-40" />
                </Card>
              ))
            : data.metrics.map((m) => <KpiCard key={m.id} metric={m} />)}
        </div>
      )}
    </section>
  )
}
