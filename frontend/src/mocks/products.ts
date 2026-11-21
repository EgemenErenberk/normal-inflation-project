import type { CoicopCode, Retailer } from '@/types'
import { addMonths, round, seededRandom } from '@/lib/utils'
import { categoryMonthly } from './categories'
import { seriesStart } from './inflation'

/** DEMO DATA – retailers, cities and product price panels. */
export const RETAILERS: Retailer[] = [
  { id: 'migros', name: 'Migros', channel: 'Mağaza + Çevrim içi' },
  { id: 'carrefoursa', name: 'CarrefourSA', channel: 'Mağaza + Çevrim içi' },
  { id: 'a101', name: 'A101', channel: 'Mağaza' },
  { id: 'bim', name: 'BİM', channel: 'Mağaza' },
  { id: 'sok', name: 'ŞOK', channel: 'Mağaza' },
  { id: 'trendyol', name: 'Trendyol', channel: 'Çevrim içi' },
  { id: 'hepsiburada', name: 'Hepsiburada', channel: 'Çevrim içi' },
  { id: 'teknosa', name: 'Teknosa', channel: 'Mağaza + Çevrim içi' },
  { id: 'opet', name: 'Opet', channel: 'Mağaza' },
  { id: 'eczane', name: 'Eczane Ağı', channel: 'Mağaza' },
]

export const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep']

interface ProductSeed {
  coicopCode: string
  displayName: string | null
  unit: string
  basePrice: number
  retailers: string[]
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { coicopCode: '01.1.1.1', displayName: 'Pirinç, baldo', unit: '1 kg', basePrice: 22.5, retailers: ['migros', 'a101', 'bim'] },
  { coicopCode: '01.1.1.3', displayName: 'Ekmek, beyaz', unit: '250 g', basePrice: 2.5, retailers: ['migros', 'sok'] },
  { coicopCode: '01.1.1.4', displayName: 'Makarna', unit: '500 g', basePrice: 5.9, retailers: ['bim', 'a101', 'carrefoursa'] },
  { coicopCode: '01.1.2.1', displayName: 'Dana kıyma', unit: '1 kg', basePrice: 85, retailers: ['migros', 'carrefoursa'] },
  { coicopCode: '01.1.2.4', displayName: 'Tavuk göğüs', unit: '1 kg', basePrice: 32, retailers: ['bim', 'sok', 'migros'] },
  { coicopCode: '01.1.4.1', displayName: 'Süt, tam yağlı', unit: '1 L', basePrice: 6.75, retailers: ['a101', 'bim', 'sok'] },
  { coicopCode: '01.1.4.5', displayName: 'Beyaz peynir', unit: '1 kg', basePrice: 58, retailers: ['migros', 'carrefoursa'] },
  { coicopCode: '01.1.4.7', displayName: 'Yumurta', unit: '30 adet', basePrice: 28, retailers: ['bim', 'a101'] },
  { coicopCode: '01.1.5.1', displayName: 'Ayçiçek yağı', unit: '5 L', basePrice: 78, retailers: ['migros', 'a101', 'bim'] },
  { coicopCode: '01.1.7.1', displayName: 'Domates', unit: '1 kg', basePrice: 6.5, retailers: ['migros', 'sok'] },
  { coicopCode: '01.1.7.3', displayName: 'Patates', unit: '1 kg', basePrice: 4.2, retailers: ['a101', 'carrefoursa'] },
  { coicopCode: '01.1.8.1', displayName: 'Toz şeker', unit: '1 kg', basePrice: 8.9, retailers: ['bim', 'sok'] },
  { coicopCode: '01.2.1.1', displayName: 'Siyah çay', unit: '1 kg', basePrice: 52, retailers: ['migros', 'trendyol'] },
  { coicopCode: '01.2.2.1', displayName: 'Maden suyu', unit: '6 x 200 ml', basePrice: 9.5, retailers: ['a101', 'bim'] },
  { coicopCode: '02.2.1.1', displayName: 'Sigara', unit: '20 adet', basePrice: 21, retailers: ['sok', 'migros'] },
  { coicopCode: '03.1.2.1', displayName: 'Erkek gömlek', unit: '1 adet', basePrice: 180, retailers: ['trendyol', 'hepsiburada'] },
  { coicopCode: '03.1.2.2', displayName: 'Kadın pantolon', unit: '1 adet', basePrice: 220, retailers: ['trendyol'] },
  { coicopCode: '03.2.1.1', displayName: 'Spor ayakkabı', unit: '1 çift', basePrice: 650, retailers: ['trendyol', 'hepsiburada'] },
  { coicopCode: '04.5.1.1', displayName: 'Elektrik', unit: '1 kWh', basePrice: 1.1, retailers: ['eczane'] },
  { coicopCode: '05.3.1.1', displayName: 'Buzdolabı', unit: '1 adet', basePrice: 6800, retailers: ['teknosa', 'hepsiburada'] },
  { coicopCode: '05.3.1.3', displayName: 'Çamaşır makinesi', unit: '1 adet', basePrice: 5900, retailers: ['teknosa', 'hepsiburada', 'trendyol'] },
  { coicopCode: '05.6.1.1', displayName: 'Çamaşır deterjanı', unit: '4 kg', basePrice: 62, retailers: ['migros', 'a101', 'carrefoursa'] },
  { coicopCode: '06.1.1.1', displayName: null, unit: '1 kutu', basePrice: 18, retailers: ['eczane'] },
  { coicopCode: '06.1.1.2', displayName: null, unit: '1 kutu', basePrice: 34, retailers: ['eczane'] },
  { coicopCode: '07.2.2.1', displayName: 'Benzin, kurşunsuz 95', unit: '1 L', basePrice: 7.8, retailers: ['opet'] },
  { coicopCode: '07.2.2.2', displayName: 'Motorin', unit: '1 L', basePrice: 7.2, retailers: ['opet'] },
  { coicopCode: '08.1.1.1', displayName: 'Akıllı telefon', unit: '1 adet', basePrice: 7200, retailers: ['teknosa', 'hepsiburada', 'trendyol'] },
  { coicopCode: '09.1.1.1', displayName: 'Televizyon, 55"', unit: '1 adet', basePrice: 9800, retailers: ['teknosa', 'hepsiburada'] },
  { coicopCode: '09.5.1.1', displayName: 'Kitap', unit: '1 adet', basePrice: 32, retailers: ['trendyol', 'hepsiburada'] },
  { coicopCode: '13.1.2.1', displayName: 'Şampuan', unit: '500 ml', basePrice: 24, retailers: ['migros', 'a101', 'trendyol'] },
  { coicopCode: '13.1.2.3', displayName: 'Diş macunu', unit: '100 ml', basePrice: 14, retailers: ['bim', 'sok', 'migros'] },
]

const PHYSICAL_ONLY = new Set(['a101', 'bim', 'sok', 'opet', 'eczane', 'migros', 'carrefoursa', 'teknosa'])

export interface ProductPanel {
  productId: string
  coicopCode: string
  categoryCode: CoicopCode
  retailerId: string
  retailerName: string
  city: string | null
  displayName: string | null
  unit: string
  /** One observation per month, aligned to seriesStart */
  prices: number[]
}

function buildPanels(): ProductPanel[] {
  const panels: ProductPanel[] = []
  let serial = 1000
  PRODUCT_SEEDS.forEach((seed, seedIdx) => {
    seed.retailers.forEach((retailerId, rIdx) => {
      const retailer = RETAILERS.find((r) => r.id === retailerId)!
      const rand = seededRandom(seedIdx * 131 + rIdx * 17 + 3)
      const categoryCode = seed.coicopCode.slice(0, 2) as CoicopCode
      const monthly = categoryMonthly[categoryCode]
      const city = PHYSICAL_ONLY.has(retailerId) ? CITIES[Math.floor(rand() * CITIES.length)] : null
      let price = seed.basePrice * (0.92 + rand() * 0.16)
      const prices = monthly.map((m) => {
        const shock = (rand() - 0.5) * 4
        const sticky = rand() < 0.18 ? 0 : 1
        price = Math.max(0.5, price * (1 + (sticky * (m + shock)) / 100))
        return round(price, 2)
      })
      serial += 7 + Math.floor(rand() * 40)
      panels.push({
        productId: `P-${seed.coicopCode.replace(/\./g, '')}-${String(serial).padStart(6, '0')}`,
        coicopCode: seed.coicopCode,
        categoryCode,
        retailerId,
        retailerName: retailer.name,
        city,
        displayName: seed.displayName,
        unit: seed.unit,
        prices,
      })
    })
  })
  return panels
}

export const PRODUCT_PANELS = buildPanels()

export function periodToObservationDate(period: string, productId: string) {
  const day = 5 + (productId.charCodeAt(productId.length - 1) % 20)
  return `${period}-${String(day).padStart(2, '0')}`
}

export function periodAtIndex(i: number) {
  return addMonths(seriesStart, i)
}
