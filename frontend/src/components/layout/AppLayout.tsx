import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { findNavItem } from '@/config/navigation'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const item = findNavItem(location.pathname)
    document.title = item ? `${item.label} | Enflasyon Analizi` : 'Enflasyon Analizi'
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        İçeriğe geç
      </a>

      <Sidebar />

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Gezinme menüsü">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Menüyü kapat"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <SidebarContent onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
