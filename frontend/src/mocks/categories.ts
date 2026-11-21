import type { CoicopCategory, CoicopCode } from '@/types'
import { round, seededRandom } from '@/lib/utils'
import { buildSeries, headlineMonthly } from './inflation'

/** DEMO DATA – COICOP 2018 main divisions with illustrative basket weights. */
export const COICOP_CATEGORIES: CoicopCategory[] = [
  { code: '01', name: 'Gıda ve Alkolsüz İçecekler', shortName: 'Gıda', weight: 24.97 },
  { code: '02', name: 'Alkollü İçecekler ve Tütün', shortName: 'Alkol ve Tütün', weight: 3.62 },
  { code: '03', name: 'Giyim ve Ayakkabı', shortName: 'Giyim', weight: 6.78 },
  { code: '04', name: 'Konut', shortName: 'Konut', weight: 15.21 },
  { code: '05', name: 'Mobilya ve Ev Eşyası', shortName: 'Mobilya', weight: 7.94 },
  { code: '06', name: 'Sağlık', shortName: 'Sağlık', weight: 4.12 },
  { code: '07', name: 'Ulaştırma', shortName: 'Ulaştırma', weight: 16.43 },
  { code: '08', name: 'Haberleşme', shortName: 'Haberleşme', weight: 3.05 },
  { code: '09', name: 'Eğlence ve Kültür', shortName: 'Eğlence', weight: 3.48 },
  { code: '10', name: 'Eğitim', shortName: 'Eğitim', weight: 2.21 },
  { code: '11', name: 'Lokanta ve Oteller', shortName: 'Lokanta', weight: 8.47 },
  { code: '12', name: 'Sigorta ve Finansal Hizmetler', shortName: 'Sigorta', weight: 1.36 },
  { code: '13', name: 'Kişisel Bakım ve Diğer Mal ve Hizmetler', shortName: 'Kişisel Bakım', weight: 2.36 },
]

/** Relative intensity vs headline and an optional seasonal profile (12 months, Jan–Dec). */
const PROFILES: Record<CoicopCode, { factor: number; volatility: number; seasonal?: number[] }> = {
  '01': { factor: 1.04, volatility: 0.9 },
  '02': { factor: 0.92, volatility: 1.4 },
  '03': { factor: 0.78, volatility: 0.6, seasonal: [-4, -2.5, 3, 5, 2.5, -1, -4.5, -2, 4, 5, 2, -1] },
  '04': { factor: 1.42, volatility: 0.5 },
  '05': { factor: 0.86, volatility: 0.5 },
  '06': { factor: 1.08, volatility: 0.8 },
  '07': { factor: 0.84, volatility: 1.2 },
  '08': { factor: 0.79, volatility: 0.7 },
  '09': { factor: 0.95, volatility: 0.7 },
  '10': { factor: 1.32, volatility: 0.4, seasonal: [0, 0, 0, 0, 0, 0, 0, 2.5, 6, 1, 0, 0] },
  '11': { factor: 1.18, volatility: 0.5 },
  '12': { factor: 1.0, volatility: 0.9 },
  '13': { factor: 1.03, volatility: 0.6 },
}

const SUBCATEGORIES: Record<CoicopCode, { code: string; name: string; share: number }[]> = {
  '01': [
    { code: '01.1.1', name: 'Ekmek ve tahıllar', share: 0.22 },
    { code: '01.1.2', name: 'Et', share: 0.2 },
    { code: '01.1.4', name: 'Süt, peynir ve yumurta', share: 0.16 },
    { code: '01.1.7', name: 'Sebzeler', share: 0.14 },
    { code: '01.1.6', name: 'Meyveler', share: 0.1 },
    { code: '01.2', name: 'Alkolsüz içecekler', share: 0.18 },
  ],
  '02': [
    { code: '02.1', name: 'Alkollü içecekler', share: 0.3 },
    { code: '02.2', name: 'Tütün', share: 0.7 },
  ],
  '03': [
    { code: '03.1', name: 'Giyim', share: 0.74 },
    { code: '03.2', name: 'Ayakkabı', share: 0.26 },
  ],
  '04': [
    { code: '04.1', name: 'Gerçek kira', share: 0.46 },
    { code: '04.4', name: 'Su ve konutla ilgili hizmetler', share: 0.14 },
    { code: '04.5', name: 'Elektrik, gaz ve diğer yakıtlar', share: 0.4 },
  ],
  '05': [
    { code: '05.1', name: 'Mobilya ve mefruşat', share: 0.34 },
    { code: '05.3', name: 'Ev aletleri', share: 0.36 },
    { code: '05.6', name: 'Rutin ev bakımı', share: 0.3 },
  ],
  '06': [
    { code: '06.1', name: 'İlaçlar ve tıbbi ürünler', share: 0.58 },
    { code: '06.2', name: 'Ayakta tedavi hizmetleri', share: 0.27 },
    { code: '06.3', name: 'Hastane hizmetleri', share: 0.15 },
  ],
  '07': [
    { code: '07.1', name: 'Araç satın alımı', share: 0.42 },
    { code: '07.2', name: 'Kişisel ulaşım araçlarının işletimi', share: 0.4 },
    { code: '07.3', name: 'Ulaştırma hizmetleri', share: 0.18 },
  ],
  '08': [
    { code: '08.1', name: 'Haberleşme ekipmanı', share: 0.38 },
    { code: '08.2', name: 'Haberleşme hizmetleri', share: 0.62 },
  ],
  '09': [
    { code: '09.1', name: 'Görsel-işitsel ekipman', share: 0.3 },
    { code: '09.4', name: 'Eğlence ve kültür hizmetleri', share: 0.42 },
    { code: '09.6', name: 'Paket turlar', share: 0.28 },
  ],
  '10': [
    { code: '10.1', name: 'Okul öncesi ve ilköğretim', share: 0.48 },
    { code: '10.2', name: 'Ortaöğretim', share: 0.22 },
    { code: '10.4', name: 'Yükseköğretim', share: 0.3 },
  ],
  '11': [
    { code: '11.1', name: 'Yiyecek ve içecek hizmetleri', share: 0.84 },
    { code: '11.2', name: 'Konaklama hizmetleri', share: 0.16 },
  ],
  '12': [
    { code: '12.1', name: 'Sigorta', share: 0.64 },
    { code: '12.2', name: 'Finansal hizmetler', share: 0.36 },
  ],
  '13': [
    { code: '13.1', name: 'Kişisel bakım', share: 0.72 },
    { code: '13.9', name: 'Diğer hizmetler', share: 0.28 },
  ],
}

function buildCategoryMonthly(code: CoicopCode) {
  const profile = PROFILES[code]
  const rand = seededRandom(Number(code) * 7919)
  return headlineMonthly.map((m, i) => {
    const noise = (rand() - 0.5) * profile.volatility
    const seasonal = profile.seasonal?.[i % 12] ?? 0
    return round(Math.max(-6, m * profile.factor + noise + seasonal), 2)
  })
}

export const categoryMonthly: Record<CoicopCode, number[]> = Object.fromEntries(
  COICOP_CATEGORIES.map((c) => [c.code, buildCategoryMonthly(c.code)]),
) as Record<CoicopCode, number[]>

export const categorySeries = Object.fromEntries(
  COICOP_CATEGORIES.map((c) => [c.code, buildSeries(categoryMonthly[c.code])]),
) as Record<CoicopCode, ReturnType<typeof buildSeries>>

export function getSubcategories(code: CoicopCode, annual: number) {
  const rand = seededRandom(Number(code) * 104729)
  return SUBCATEGORIES[code].map((s) => ({
    code: s.code,
    name: s.name,
    weight: round(s.share * 100, 1),
    annual: round(annual * (0.75 + rand() * 0.5), 2),
  }))
}
