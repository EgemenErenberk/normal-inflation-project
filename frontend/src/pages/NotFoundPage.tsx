import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

export function NotFoundPage() {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="num text-4xl font-semibold text-navy">404</p>
      <p className="text-sm text-muted">Aradığınız sayfa bulunamadı.</p>
      <Link to="/" className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-soft">
        Genel bakışa dön
      </Link>
    </Card>
  )
}
