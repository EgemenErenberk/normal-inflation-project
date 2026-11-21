import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { CategoryInflation } from '@/types'
import { useCategories, useSummary } from '@/hooks/useInflationData'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChangeBadge } from '@/components/ui/ChangeBadge'
import { Sparkline } from '@/components/ui/Sparkline'
import { ErrorState, Skeleton } from '@/components/ui/States'

function CategoryTile({ category, maxAnnual, headline }: { category: CategoryInflation; maxAnnual: number; headline: number }) {
  const aboveHeadline = category.annual > headline
  return (
    <Link
      to={`/kategoriler/${category.code}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="num mt-px rounded bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-white">{category.code}</span>
          <p className="text-[13px] font-medium leading-snug text-navy">{category.name}</p>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="num text-lg font-semibold text-navy">{formatPercent(category.annual)}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <ChangeBadge value={category.annualChange} />
            <span className="text-[11px] text-subtle">yıllık</span>
          </div>
        </div>
        <Sparkline data={category.trend} width={72} height={26} color={aboveHeadline ? 'var(--color-up)' : 'var(--color-navy)'} />
      </div>

      <div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-muted ring-1 ring-inset ring-border">
          <div
            className={cn('h-full rounded-full', aboveHeadline ? 'bg-up/80' : 'bg-navy/60')}
            style={{ width: `${Math.min(100, (category.annual / maxAnnual) * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 flex justify-between text-[11px] text-subtle">
          <span>Ağırlık <span className="num text-muted">{formatPercent(category.weight)}</span></span>
          <span>Aylık <span className="num text-muted">{formatPercent(category.monthly)}</span></span>
        </p>
      </div>
    </Link>
  )
}

export function CategoryOverview() {
  const { data, error, isLoading, mutate } = useCategories()
  const { data: summary } = useSummary()
  const headline = summary?.metrics.find((m) => m.id === 'annual')?.value ?? 0
  const maxAnnual = data ? Math.max(...data.map((c) => c.annual)) : 1

  return (
    <Card>
      <CardHeader
        title="COICOP Ana Harcama Grupları"
        description="13 ana grup · yıllık enflasyon ve sepet ağırlığı · kırmızı: genel enflasyonun üzerinde"
        actions={
          <Link
            to="/kategoriler"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
          >
            Kategori analizi
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <div className="p-4 sm:p-5">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data.map((c) => (
              <li key={c.code} className="contents">
                <CategoryTile category={c} maxAnnual={maxAnnual} headline={headline} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
