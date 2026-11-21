import { useState } from 'react'
import { useTrend } from '@/hooks/useInflationData'
import { PRESET_DESCRIPTIONS, useDateRange } from '@/context/DateRangeContext'
import { formatPercent, formatPeriod } from '@/lib/format'
import { Card, CardHeader } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/Controls'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { InflationTrendChart, TREND_METRIC_LABELS, type TrendMetric } from '@/components/charts/InflationTrendChart'

export function TrendSection() {
  const [metric, setMetric] = useState<TrendMetric>('monthly')
  const { data, error, isLoading, mutate } = useTrend()
  const { preset } = useDateRange()

  const peak = data?.length ? data.reduce((a, b) => (b[metric] > a[metric] ? b : a)) : null
  const low = data?.length ? data.reduce((a, b) => (b[metric] < a[metric] ? b : a)) : null

  return (
    <Card>
      <CardHeader
        id="trend-heading"
        title="Enflasyon Eğilimi"
        description={`${PRESET_DESCRIPTIONS[preset]} · TÜFE benzeri genel fiyat endeksi`}
        actions={
          <SegmentedControl
            label="Gösterge"
            value={metric}
            onChange={setMetric}
            options={(Object.keys(TREND_METRIC_LABELS) as TrendMetric[]).map((k) => ({
              value: k,
              label: TREND_METRIC_LABELS[k],
            }))}
          />
        }
      />
      <div className="px-3 pb-4 pt-3 sm:px-5">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-[340px] w-full" />
        ) : data.length === 0 ? (
          <EmptyState title="Seçilen aralıkta veri yok" description="Farklı bir tarih aralığı seçin." />
        ) : (
          <>
            <InflationTrendChart data={data} metric={metric} />
            {metric !== 'index' && peak && low && (
              <dl className="mt-2 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-subtle">En yüksek</dt>
                  <dd className="num mt-0.5 font-medium text-ink">
                    {formatPercent(peak[metric])} <span className="text-subtle">({formatPeriod(peak.period)})</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle">En düşük</dt>
                  <dd className="num mt-0.5 font-medium text-ink">
                    {formatPercent(low[metric])} <span className="text-subtle">({formatPeriod(low.period)})</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle">Son değer</dt>
                  <dd className="num mt-0.5 font-medium text-ink">{formatPercent(data.at(-1)![metric])}</dd>
                </div>
                <div>
                  <dt className="text-subtle">Gözlem</dt>
                  <dd className="num mt-0.5 font-medium text-ink">{data.length} ay</dd>
                </div>
              </dl>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
