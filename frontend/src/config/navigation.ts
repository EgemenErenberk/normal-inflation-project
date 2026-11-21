import { Database, Info, LayoutDashboard, PieChart, Tags, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Genel Bakış', description: 'Temel göstergeler ve enflasyon eğilimi', icon: LayoutDashboard },
  { to: '/kategoriler', label: 'Kategori Analizi', description: 'COICOP ana harcama grupları', icon: PieChart },
  { to: '/fiyatlar', label: 'Fiyat Analizi', description: 'Ürün bazlı fiyat hareketleri', icon: Tags },
  { to: '/kaynaklar', label: 'Veri Kaynakları', description: 'Bağlı kaynaklar ve veri durumu', icon: Database },
  { to: '/hakkinda', label: 'Hakkında', description: 'Metodoloji ve platform bilgisi', icon: Info },
]

export function findNavItem(pathname: string) {
  if (pathname === '/') return NAV_ITEMS[0]
  return NAV_ITEMS.find((item) => item.to !== '/' && pathname.startsWith(item.to))
}
