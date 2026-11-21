import { env } from '@/config/env'
import { Card, CardHeader } from '@/components/ui/Card'
import { PageIntro } from '@/components/layout/PageIntro'

const SECTIONS = [
  {
    title: 'Amaç',
    body: 'Enflasyon Analizi, Türkiye’de tüketici fiyatlarındaki değişimi ürün düzeyinde gözlemleyerek bağımsız, şeffaf ve tekrarlanabilir enflasyon göstergeleri üretmeyi amaçlayan bir araştırma platformudur.',
  },
  {
    title: 'Sınıflama',
    body: 'Ürünler COICOP 2018 (Bireysel Tüketimin Amaca Göre Sınıflandırması) standardına göre 13 ana harcama grubuna ve alt sınıflara eşlenir. Kategori ağırlıkları hane halkı tüketim harcaması yapısını temsil eder.',
  },
  {
    title: 'Ürün kimliği',
    body: 'Her gözlem benzersiz bir ürün ID’si ile eşleştirilir. Ürün adları yalnızca okunabilirlik için tutulan yardımcı etiketlerdir; endeks hesabı ve eşleştirme ürün ID’si ve COICOP kodu üzerinden yapılır.',
  },
  {
    title: 'Hesaplama',
    body: 'Alt sınıf düzeyinde fiyat oranları geometrik ortalama ile birleştirilir, ardından sepet ağırlıklarıyla zincirlenmiş Laspeyres tipi bir endeks oluşturulur. Aylık değişim ardışık iki ayın, yıllık değişim ise bir önceki yılın aynı ayının karşılaştırılmasıdır.',
  },
]

export function AboutPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageIntro
        title="Hakkında"
        description="Platformun amacı, kullanılan sınıflama ve hesaplama yöntemi hakkında özet bilgi."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {SECTIONS.map((s) => (
            <Card key={s.title} className="p-5">
              <h3 className="text-sm font-semibold text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">{s.body}</p>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader title="Teknik Durum" />
          <dl className="divide-y divide-border text-sm">
            {[
              { k: 'Veri modu', v: env.useMockData ? 'Demo (mock) veri' : 'Canlı API' },
              { k: 'API adresi', v: env.apiBaseUrl },
              { k: 'Sınıflama', v: 'COICOP 2018' },
              { k: 'Para birimi', v: 'Türk lirası (TRY)' },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between gap-3 px-5 py-3">
                <dt className="text-muted">{row.k}</dt>
                <dd className="num truncate text-right text-xs font-medium text-navy">{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-subtle">
            Gerçek verilere geçmek için <code className="num text-ink">VITE_USE_MOCK_DATA=false</code> ve{' '}
            <code className="num text-ink">VITE_API_BASE_URL</code> değişkenlerini tanımlayın.
          </p>
        </Card>
      </div>
    </div>
  )
}
