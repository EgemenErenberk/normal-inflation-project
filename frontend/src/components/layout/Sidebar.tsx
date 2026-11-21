import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_ITEMS } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { useDateRange } from '@/context/DateRangeContext'
import { formatPeriod } from '@/lib/format'
import { Logo } from './Logo'

interface SidebarProps {
  onNavigate?: () => void
  onClose?: () => void
}

export function SidebarContent({ onNavigate, onClose }: SidebarProps) {
  const { meta } = useDateRange()

  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Menüyü kapat"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Ana gezinme" className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Analiz</p>
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-white transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden="true"
                    />
                    <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="m-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-xs font-medium text-white">Veri akışı aktif</p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/55">
          {meta ? `Veriler ${formatPeriod(meta.dataThrough, 'long')} dönemine kadar` : 'Yükleniyor…'}
        </p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-amber-300/90">
          Gösterim amaçlı demo veri
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <SidebarContent />
    </aside>
  )
}
