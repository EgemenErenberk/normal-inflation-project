import type { DataSource, SourceStatus } from '@/types'
import { useDataSources } from '@/hooks/useInflationData'
import { formatCompact, formatDateTime, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardHeader } from '@/components/ui/Card'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { tableHeadClass, tableRowClass } from '@/components/ui/Table'
import { DemoNotice, PageIntro } from '@/components/layout/PageIntro'

const STATUS: Record<SourceStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Aktif', className: 'bg-down-soft text-down', dot: 'bg-down' },
  delayed: { label: 'Gecikmeli', className: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  error: { label: 'Hata', className: 'bg-up-soft text-up', dot: 'bg-up' },
  paused: { label: 'Duraklatıldı', className: 'bg-surface-muted text-muted', dot: 'bg-subtle' },
}

function StatusBadge({ status }: { status: SourceStatus }) {
  const s = STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium', s.className)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  )
}

function Summary({ sources }: { sources: DataSource[] }) {
  const total = sources.reduce((s, x) => s + x.recordCount, 0)
  const active = sources.filter((s) => s.status === 'active').length
  const coverage = sources.reduce((s, x) => s + x.coverage, 0) / sources.length
  const retailers = new Set(sources.flatMap((s) => s.retailers)).size
  const items = [
    { label: 'Toplam kayıt', value: formatCompact(total) },
    { label: 'Aktif kaynak', value: `${active} / ${sources.length}` },
    { label: 'Ortalama kapsama', value: formatPercent(coverage, 1) },
    { label: 'Mağaza / zincir', value: formatNumber(retailers) },
  ]
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((i) => (
        <Card key={i.label} className="p-5">
          <dt className="text-xs text-muted">{i.label}</dt>
          <dd className="num mt-2 text-2xl font-semibold text-navy">{i.value}</dd>
        </Card>
      ))}
    </dl>
  )
}

export function SourcesPage() {
  const { data, error, isLoading, mutate } = useDataSources()

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        title="Veri Kaynakları"
        description="Fiyat gözlemlerinin toplandığı kaynaklar, güncelleme sıklıkları ve son başarılı veri çekim zamanları."
      />
      <DemoNotice />

      {error ? (
        <Card>
          <ErrorState error={error} onRetry={() => mutate()} />
        </Card>
      ) : isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <Summary sources={data} />
          <Card>
            <CardHeader title="Kaynak Listesi" description={`${data.length} kaynak tanımlı`} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <caption className="sr-only">Veri kaynakları ve durumları</caption>
                <thead className={tableHeadClass}>
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Kaynak</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Tür</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Sıklık</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Son başarılı çekim</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Kayıt</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Kapsama</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.id} className={tableRowClass}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-navy">{s.name}</p>
                        <p className="mt-0.5 text-[11px] text-subtle">{s.retailers.join(', ')}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{s.type}</td>
                      <td className="px-4 py-3 text-muted">{s.frequency}</td>
                      <td className="num px-4 py-3 text-xs text-muted">{formatDateTime(s.lastSuccess)}</td>
                      <td className="num px-4 py-3 text-right">{formatNumber(s.recordCount)}</td>
                      <td className="px-4 py-3">
                        <div className="ml-auto flex w-28 items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-surface-muted ring-1 ring-inset ring-border">
                            <div className="h-full rounded-full bg-navy" style={{ width: `${s.coverage}%` }} />
                          </div>
                          <span className="num w-10 text-right text-xs">{formatNumber(s.coverage, 0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
