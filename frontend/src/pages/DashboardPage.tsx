import { DemoNotice } from '@/components/layout/PageIntro'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { TrendSection } from '@/components/dashboard/TrendSection'
import { ContributionPanel } from '@/components/dashboard/ContributionPanel'
import { CategoryOverview } from '@/components/dashboard/CategoryOverview'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DemoNotice />
      <KpiCards />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendSection />
        </div>
        <ContributionPanel />
      </div>
      <CategoryOverview />
    </div>
  )
}
