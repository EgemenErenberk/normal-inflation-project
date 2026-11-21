import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarClock, Menu, Search } from 'lucide-react'
import { findNavItem } from '@/config/navigation'
import { DATE_RANGE_PRESETS, PRESET_DESCRIPTIONS, useDateRange } from '@/context/DateRangeContext'
import { formatDateTime, formatPeriod } from '@/lib/format'
import { SegmentedControl } from '@/components/ui/Controls'

interface TopbarProps {
  onOpenMenu: () => void
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { preset, setPreset, range, meta } = useDateRange()
  const [query, setQuery] = useState('')
  const current = findNavItem(location.pathname)

  const submitSearch = (e?: FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    navigate(q ? `/fiyatlar?q=${encodeURIComponent(q)}` : '/fiyatlar')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="-ml-1 rounded-md p-2 text-navy hover:bg-surface-muted lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-navy sm:text-lg">{current?.label ?? 'Sayfa bulunamadı'}</h1>
          <p className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {meta ? <>Son güncelleme: {formatDateTime(meta.lastUpdated)}</> : 'Güncelleme bilgisi yükleniyor…'}
          </p>
        </div>

        <form role="search" onSubmit={submitSearch} className="relative hidden md:block">
          <label htmlFor="global-search" className="sr-only">
            Ürün ID veya COICOP kodu ara
          </label>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ürün ID, COICOP kodu…"
            className="h-9 w-56 rounded-lg border border-border bg-surface-muted pl-8 pr-3 text-sm placeholder:text-subtle hover:border-border-strong focus:bg-surface xl:w-64"
          />
        </form>

        <SegmentedControl
          label="Tarih aralığı"
          value={preset}
          onChange={setPreset}
          options={DATE_RANGE_PRESETS.map((p) => ({ value: p.value, label: p.label, title: PRESET_DESCRIPTIONS[p.value] }))}
          className="hidden sm:inline-flex"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 sm:hidden">
        <SegmentedControl
          label="Tarih aralığı"
          size="sm"
          value={preset}
          onChange={setPreset}
          options={DATE_RANGE_PRESETS.map((p) => ({ value: p.value, label: p.label, title: PRESET_DESCRIPTIONS[p.value] }))}
        />
        {range && (
          <span className="num text-[11px] text-muted">
            {formatPeriod(range.start)} – {formatPeriod(range.end)}
          </span>
        )}
      </div>
    </header>
  )
}
