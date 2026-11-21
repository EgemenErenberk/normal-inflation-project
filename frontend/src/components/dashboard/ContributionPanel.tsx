import { Link } from 'react-router-dom'
import { useCategories } from '@/hooks/useInflationData'
import { formatNumber, formatPercent } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/States'

export function ContributionPanel() {
  const { data, error, isLoading, mutate } = useCategories()
  const rows = data ? [...data].sort((a, b) => b.contribution - a.contribution).slice(0, 6) : []
  const max = rows[0]?.contribution ?? 1
  const total = data?.reduce((s, c) => s + c.contribution, 0) ?? 0

  return (
    <Card className="flex flex-col">
      <CardHeader title="Yıllık Enflasyona Katkı" description="En yüksek katkı yapan gruplar · puan" />
      <div className="flex-1 p-5">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : (
          <>
            <ol className="flex flex-col gap-3.5">
              {rows.map((r) => (
                <li key={r.code}>
                  <Link to={`/kategoriler/${r.code}`} className="group block rounded">
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="truncate text-ink group-hover:text-accent">
                        <span className="num mr-1.5 text-subtle">{r.code}</span>
                        {r.shortName}
                      </span>
                      <span className="num shrink-0 font-medium text-navy">{formatNumber(r.contribution, 2)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-navy" style={{ width: `${(r.contribution / max) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-border pt-3 text-xs text-muted">
              İlk 6 grubun toplam katkısı{' '}
              <span className="num font-medium text-navy">
                {formatPercent(total ? (rows.reduce((s, r) => s + r.contribution, 0) / total) * 100 : 0, 1)}
              </span>
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
