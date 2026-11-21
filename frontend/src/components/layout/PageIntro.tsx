import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

export function PageIntro({ title, description, actions }: { title: string; description: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-navy text-balance">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted text-pretty">{description}</p>
      </div>
      {actions}
    </div>
  )
}

export function DemoNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-warn/20 bg-warn-soft px-4 py-2.5 text-xs text-warn">
      <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Gösterim amaçlı demo veri.</span> Bu sayfadaki değerler gerçekçi örneklerdir ve resmi
        istatistik niteliği taşımaz. FastAPI servisi bağlandığında gerçek verilerle değiştirilecektir.
      </p>
    </div>
  )
}
