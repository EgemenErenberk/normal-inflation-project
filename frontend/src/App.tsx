import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { DateRangeProvider } from '@/context/DateRangeContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { PricesPage } from '@/pages/PricesPage'
import { SourcesPage } from '@/pages/SourcesPage'
import { AboutPage } from '@/pages/AboutPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, dedupingInterval: 60_000 }}>
      <DateRangeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="kategoriler" element={<CategoriesPage />} />
              <Route path="kategoriler/:code" element={<CategoriesPage />} />
              <Route path="fiyatlar" element={<PricesPage />} />
              <Route path="kaynaklar" element={<SourcesPage />} />
              <Route path="hakkinda" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DateRangeProvider>
    </SWRConfig>
  )
}
