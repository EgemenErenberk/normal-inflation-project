import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { InflationPoint } from '@/types'
import { formatNumber, formatPercent, formatPeriod } from '@/lib/format'
import { CHART_COLORS, ChartLegend, ChartTooltip, axisTickStyle } from './ChartTooltip'

interface CategoryTrendChartProps {
  category: InflationPoint[]
  headline: InflationPoint[]
  categoryLabel: string
  metric: 'annual' | 'monthly'
}

export function CategoryTrendChart({ category, headline, categoryLabel, metric }: CategoryTrendChartProps) {
  const headlineByPeriod = new Map(headline.map((p) => [p.period, p[metric]]))
  const data = category.map((p) => ({
    period: p.period,
    category: p[metric],
    headline: headlineByPeriod.get(p.period) ?? null,
  }))
  const tickInterval = Math.max(0, Math.ceil(data.length / 7) - 1)

  return (
    <div className="flex flex-col gap-3">
      <ChartLegend
        items={[
          { label: categoryLabel, color: CHART_COLORS.accent },
          { label: 'Genel enflasyon', color: CHART_COLORS.navy, dashed: true },
        ]}
      />
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="period"
              tickFormatter={(p: string) => formatPeriod(p)}
              interval={tickInterval}
              tick={axisTickStyle}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(v: number) => `%${formatNumber(v, metric === 'monthly' ? 1 : 0)}`}
              tick={axisTickStyle}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: CHART_COLORS.muted }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as (typeof data)[number] | undefined
                if (!row) return null
                return (
                  <ChartTooltip
                    active={active}
                    title={formatPeriod(row.period, 'long')}
                    rows={[
                      { label: categoryLabel, value: formatPercent(row.category), color: CHART_COLORS.accent },
                      ...(row.headline !== null
                        ? [{ label: 'Genel', value: formatPercent(row.headline), color: CHART_COLORS.navy }]
                        : []),
                    ]}
                  />
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="headline"
              stroke={CHART_COLORS.navy}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="category"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
