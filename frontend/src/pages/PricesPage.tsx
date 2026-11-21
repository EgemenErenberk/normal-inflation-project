import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import type { CoicopCode, ProductPrice } from '@/types'
import { useCities, usePrices, useProductHistory, useRetailers } from '@/hooks/useInflationData'
import { useSortable } from '@/hooks/useSortable'
import { COICOP_CATEGORIES } from '@/mocks/categories'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChangeBadge } from '@/components/ui/ChangeBadge'
import { Select } from '@/components/ui/Controls'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { SortableHeader, tableHeadClass, tableRowClass } from '@/components/ui/Table'
import { PriceHistoryChart } from '@/components/charts/PriceHistoryChart'
import { DemoNotice, PageIntro } from '@/components/layout/PageIntro'

type SortKey = 'productId' | 'coicopCode' | 'retailerName' | 'city' | 'date' | 'price' | 'change'

const ACCESSORS: Record<SortKey, (p: ProductPrice) => string | number | null> = {
  productId: (p) => p.productId,
  coicopCode: (p) => p.coicopCode,
  retailerName: (p) => p.retailerName,
  city: (p) => p.city,
  date: (p) => p.date,
  price: (p) => p.price,
  change: (p) => p.change,
}

const PAGE_SIZE = 25

function ProductHistoryPanel({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data, error, isLoading, mutate } = useProductHistory(productId)
  const first = data?.observations[0]?.price
  const last = data?.observations.at(-1)?.price

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            Fiyat geçmişi <span className="num rounded bg-surface-muted px-1.5 py-0.5 text-xs ring-1 ring-border">{productId}</span>
          </span>
        }
        description={
          data
            ? [data.displayName, data.coicopCode, data.retailerName, data.city ?? 'Ulusal', data.unit].filter(Boolean).join(' · ')
            : 'Yükleniyor…'
        }
        actions={
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-navy"
            aria-label="Fiyat geçmişini kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        }
      />
      <div className="p-5">
        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <Skeleton className="h-64" />
        ) : data.observations.length < 2 ? (
          <EmptyState title="Yeterli gözlem yok" description="Bu ürün için seçili aralıkta grafik çizilecek kadar fiyat gözlemi bulunmuyor." />
        ) : (
          <>
            <PriceHistoryChart data={data.observations} unit={data.unit} />
            {first && last && (
              <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3 text-xs">
                <div>
                  <dt className="text-subtle">İlk gözlem</dt>
                  <dd className="num mt-0.5 font-medium">{formatCurrency(first)}</dd>
                </div>
                <div>
                  <dt className="text-subtle">Son gözlem</dt>
                  <dd className="num mt-0.5 font-medium">{formatCurrency(last)}</dd>
                </div>
                <div>
                  <dt className="text-subtle">Değişim</dt>
                  <dd className="mt-0.5">
                    <ChangeBadge value={((last - first) / first) * 100} unit="percent" />
                  </dd>
                </div>
              </dl>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export function PricesPage() {
  const [params, setParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filters = {
    retailerId: params.get('magaza') ?? undefined,
    categoryCode: (params.get('kategori') as CoicopCode | null) ?? undefined,
    city: params.get('sehir') ?? undefined,
    search: params.get('q') ?? undefined,
  }

  const { data: retailers } = useRetailers()
  const { data: cities } = useCities()
  const { data, error, isLoading, isValidating, mutate } = usePrices(filters)
  const { sorted, sort, toggle } = useSortable<ProductPrice, SortKey>(data, ACCESSORS, { key: 'change', direction: 'desc' })

  useEffect(() => {
    setSearchInput(params.get('q') ?? '')
  }, [params])

  useEffect(() => {
    setPage(0)
  }, [filters.retailerId, filters.categoryCode, filters.city, filters.search, sort.key, sort.direction])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if ((params.get('q') ?? '') !== searchInput.trim()) updateParam('q', searchInput.trim())
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const hasFilters = Boolean(filters.retailerId || filters.categoryCode || filters.city || filters.search)
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        title="Fiyat Analizi"
        description="Ürün kimliği (ID) ve COICOP alt sınıf kodu bazında izlenen fiyat gözlemleri. Ürün adı yalnızca yardımcı etikettir; endeks hesabı ürün ID'si üzerinden yapılır."
      />
      <DemoNotice />

      <Card>
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end sm:p-5">
          <div className="flex min-w-0 flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <label htmlFor="price-search" className="text-[11px] font-medium uppercase tracking-wide text-subtle">
              Ara
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
              <input
                id="price-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Ürün ID, COICOP kodu veya etiket"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm placeholder:text-subtle hover:border-border-strong"
              />
            </div>
          </div>
          <Select
            label="Mağaza"
            value={filters.retailerId ?? ''}
            onChange={(e) => updateParam('magaza', e.target.value)}
            placeholder="Tüm mağazalar"
            options={(retailers ?? []).map((r) => ({ value: r.id, label: r.name }))}
          />
          <Select
            label="Kategori"
            value={filters.categoryCode ?? ''}
            onChange={(e) => updateParam('kategori', e.target.value)}
            placeholder="Tüm kategoriler"
            options={COICOP_CATEGORIES.map((c) => ({ value: c.code, label: `${c.code} · ${c.shortName}` }))}
          />
          <Select
            label="Şehir"
            value={filters.city ?? ''}
            onChange={(e) => updateParam('sehir', e.target.value)}
            placeholder="Tüm şehirler"
            options={(cities ?? []).map((c) => ({ value: c, label: c }))}
          />
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setSearchInput('')
              setParams({}, { replace: true })
            }}
            className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-navy hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Temizle
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-muted sm:px-5">
          <p aria-live="polite">
            {data ? (
              <>
                <span className="num font-medium text-ink">{formatNumber(sorted.length)}</span> ürün gözlemi
              </>
            ) : (
              'Yükleniyor…'
            )}
            {isValidating && data && <span className="ml-2 text-subtle">güncelleniyor…</span>}
          </p>
          <p className="hidden sm:block">Bir satıra tıklayarak fiyat geçmişini görüntüleyin</p>
        </div>

        {error ? (
          <ErrorState error={error} onRetry={() => mutate()} />
        ) : (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[860px] text-sm">
              <caption className="sr-only">Ürün fiyat gözlemleri</caption>
              <thead className={tableHeadClass}>
                <tr>
                  <SortableHeader sortKey="productId" sort={sort} onSort={toggle}>Ürün ID</SortableHeader>
                  <SortableHeader sortKey="coicopCode" sort={sort} onSort={toggle}>COICOP</SortableHeader>
                  <SortableHeader sortKey="retailerName" sort={sort} onSort={toggle}>Mağaza</SortableHeader>
                  <SortableHeader sortKey="city" sort={sort} onSort={toggle}>Şehir</SortableHeader>
                  <SortableHeader sortKey="date" sort={sort} onSort={toggle}>Tarih</SortableHeader>
                  <SortableHeader sortKey="price" sort={sort} onSort={toggle} align="right">Fiyat</SortableHeader>
                  <SortableHeader sortKey="change" sort={sort} onSort={toggle} align="right">Değişim</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {isLoading && !data ? (
                  Array.from({ length: 8 }, (_, i) => (
                    <tr key={i} className={tableRowClass}>
                      <td colSpan={7} className="px-4 py-3">
                        <Skeleton className="h-5" />
                      </td>
                    </tr>
                  ))
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="Eşleşen ürün bulunamadı"
                        description="Arama terimini veya filtreleri değiştirmeyi deneyin."
                      />
                    </td>
                  </tr>
                ) : (
                  visible.map((p) => {
                    const active = p.productId === selectedId
                    return (
                      <tr
                        key={p.productId}
                        onClick={() => setSelectedId(p.productId)}
                        className={cn(tableRowClass, 'cursor-pointer hover:bg-surface-muted', active && 'bg-accent-soft/60')}
                      >
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedId(p.productId)
                            }}
                            aria-pressed={active}
                            className="num text-left text-xs font-medium text-navy hover:text-accent"
                          >
                            {p.productId}
                          </button>
                          {p.displayName && <p className="mt-0.5 max-w-56 truncate text-[11px] text-subtle">{p.displayName}</p>}
                        </td>
                        <td className="num px-4 py-2.5 text-xs text-muted">{p.coicopCode}</td>
                        <td className="px-4 py-2.5 text-ink">{p.retailerName}</td>
                        <td className="px-4 py-2.5 text-muted">{p.city ?? <span className="text-subtle">Ulusal</span>}</td>
                        <td className="num px-4 py-2.5 text-xs text-muted">{formatDate(p.date)}</td>
                        <td className="num px-4 py-2.5 text-right font-medium text-navy">
                          {formatCurrency(p.price)}
                          <span className="ml-1 text-[11px] font-normal text-subtle">/{p.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <ChangeBadge value={p.change} unit="percent" />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {sorted.length > PAGE_SIZE && (
          <nav aria-label="Sayfalama" className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs sm:px-5">
            <p className="text-muted">
              Sayfa <span className="num text-ink">{page + 1}</span> / <span className="num">{pageCount}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-navy hover:bg-surface-muted disabled:opacity-40"
              >
                Önceki
              </button>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-navy hover:bg-surface-muted disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </nav>
        )}
      </Card>

      {selectedId && <ProductHistoryPanel productId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
