import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { CategoryInflation, CoicopCode } from '@/types'
import { useCategories, useCategory, useSummary, useTrend } from '@/hooks/useInflationData'
import { useSortable } from '@/hooks/useSortable'
import { formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChangeBadge } from '@/components/ui/ChangeBadge'
import { SegmentedControl } from '@/components/ui/Controls'
import { Sparkline } from '@/components/ui/Sparkline'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { SortableHeader, tableHeadClass, tableRowClass } from '@/components/ui/Table'
import { CategoryComparisonChart } from '@/components/charts/CategoryComparisonChart'
import { CategoryTrendChart } from '@/components/charts/CategoryTrendChart'
import { DemoNotice, PageIntro } from '@/components/layout/PageIntro'

type SortKey = 'code' | 'name' | 'weight' | 'monthly' | 'annual' | 'contribution'

const ACCESSORS: Record<SortKey, (c: CategoryInflation) => string | number> = {
  code: (c) => c.code,
  name: (c) => c.name,
  weight: (c) => c.weight,
  monthly: (c) => c.monthly,
  annual: (c) => c.annual,
  contribution: (c) => c.contribution,
}

const VALID_CODES = new Set(Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, '0')))

function CategoryDetailPanel({ code }: { code: CoicopCode }) {
  const [metric, setMetric] = useState<'annual' | 'monthly'>('annual')
  const { data, error, isLoading, mutate } = useCategory(code)
  const { data: headline } = useTrend()

  return (
    <Card>
      <CardHeader
        title={data ? `${data.code} · ${data.name}` : 'Kategori detayı'}
        description="Kategori enflasyonu ile genel enflasyonun karşılaştırması"
        actions={
          <SegmentedControl
            label="Gösterge"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'annual', label: 'Yıllık' },
              { value: 'monthly', label: 'Aylık' },
            ]}
          />
        }
      />
      <div className="p-5">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Yıllık', value: formatPercent(data.annual) },
                { label: 'Aylık', value: formatPercent(data.monthly) },
                { label: 'Sepet ağırlığı', value: formatPercent(data.weight) },
                { label: 'Katkı', value: `${formatNumber(data.contribution, 2)} puan` },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-surface-muted px-3 py-2.5 ring-1 ring-inset ring-border">
                  <dt className="text-[11px] text-subtle">{s.label}</dt>
                  <dd className="num mt-0.5 text-base font-semibold text-navy">{s.value}</dd>
                </div>
              ))}
            </dl>

            <CategoryTrendChart
              category={data.series}
              headline={headline ?? []}
              categoryLabel={data.shortName}
              metric={metric}
            />

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Alt gruplar</h3>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {data.subcategories.map((s) => (
                  <li key={s.code} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="num mr-2 text-xs text-subtle">{s.code}</span>
                      {s.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-4">
                      <span className="num hidden text-xs text-subtle sm:inline">ağ. {formatPercent(s.weight)}</span>
                      <span className="num w-16 text-right font-medium text-navy">{formatPercent(s.annual)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export function CategoriesPage() {
  const { code: paramCode } = useParams()
  const navigate = useNavigate()
  const selected = (paramCode && VALID_CODES.has(paramCode) ? paramCode : '01') as CoicopCode
  const { data, error, isLoading, mutate } = useCategories()
  const { data: summary } = useSummary()
  const headline = summary?.metrics.find((m) => m.id === 'annual')?.value ?? 0
  const { sorted, sort, toggle } = useSortable<CategoryInflation, SortKey>(data, ACCESSORS, { key: 'weight', direction: 'desc' })
  const select = (code: CoicopCode) => navigate(`/kategoriler/${code}`)

  if (paramCode && !VALID_CODES.has(paramCode)) {
    return (
      <Card>
        <EmptyState title="Kategori bulunamadı" description={`"${paramCode}" geçerli bir COICOP ana grup kodu değil.`} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        title="Kategori Analizi"
        description="COICOP 2018 sınıflamasına göre 13 ana harcama grubunun aylık ve yıllık enflasyonu, sepet ağırlıkları ve genel enflasyona katkıları."
      />
      <DemoNotice />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Yıllık Enflasyon Karşılaştırması" description="Bir gruba tıklayarak detayını görüntüleyin" />
          <div className="px-2 py-4 sm:px-4">
            {error ? (
              <ErrorState error={error} onRetry={() => mutate()} />
            ) : isLoading || !data ? (
              <Skeleton className="h-[430px]" />
            ) : (
              <CategoryComparisonChart data={data} headline={headline} selected={selected} onSelect={select} />
            )}
          </div>
        </Card>
        <div className="xl:col-span-3">
          <CategoryDetailPanel code={selected} />
        </div>
      </div>

      <Card>
        <CardHeader title="Tüm Ana Gruplar" description="Sütun başlıklarına tıklayarak sıralayın" />
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">COICOP ana harcama gruplarına göre enflasyon</caption>
              <thead className={tableHeadClass}>
                <tr>
                  <SortableHeader sortKey="code" sort={sort} onSort={toggle} className="w-16 text-left">Kod</SortableHeader>
                  <SortableHeader sortKey="name" sort={sort} onSort={toggle} className="text-left">Ana grup</SortableHeader>
                  <SortableHeader sortKey="weight" sort={sort} onSort={toggle} align="right">Ağırlık</SortableHeader>
                  <SortableHeader sortKey="monthly" sort={sort} onSort={toggle} align="right">Aylık</SortableHeader>
                  <SortableHeader sortKey="annual" sort={sort} onSort={toggle} align="right">Yıllık</SortableHeader>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Değişim</th>
                  <SortableHeader sortKey="contribution" sort={sort} onSort={toggle} align="right">Katkı</SortableHeader>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Eğilim</th>
                </tr>
              </thead>
              <tbody>
                {isLoading || !data
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className={tableRowClass}>
                        <td colSpan={8} className="px-4 py-3">
                          <Skeleton className="h-5" />
                        </td>
                      </tr>
                    ))
                  : sorted.map((c) => (
                      <tr
                        key={c.code}
                        className={cn(tableRowClass, 'hover:bg-surface-muted', c.code === selected && 'bg-accent-soft/60')}
                      >
                        <td className="num px-4 py-2.5 text-xs text-subtle">{c.code}</td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => select(c.code)}
                            className="text-left font-medium text-navy hover:text-accent"
                            aria-current={c.code === selected ? 'true' : undefined}
                          >
                            {c.name}
                          </button>
                        </td>
                        <td className="num px-4 py-2.5 text-right text-muted">{formatPercent(c.weight)}</td>
                        <td className="num px-4 py-2.5 text-right">{formatPercent(c.monthly)}</td>
                        <td
                          className={cn(
                            'num px-4 py-2.5 text-right font-semibold',
                            c.annual > headline ? 'text-up' : 'text-navy',
                          )}
                        >
                          {formatPercent(c.annual)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <ChangeBadge value={c.annualChange} />
                        </td>
                        <td className="num px-4 py-2.5 text-right">{formatNumber(c.contribution, 2)}</td>
                        <td className="px-4 py-2.5">
                          <Sparkline data={c.trend} width={80} height={22} className="ml-auto" />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
