import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CategoryInflation, CoicopCode } from '@/types'
import { formatNumber, formatPercent } from '@/lib/format'
import { CHART_COLORS, ChartTooltip, axisTickStyle } from './ChartTooltip'

interface CategoryComparisonChartProps {
  data: CategoryInflation[]
  headline: number
  selected?: CoicopCode
  onSelect?: (code: CoicopCode) => void
}

export function CategoryComparisonChart({ data, headline, selected, onSelect }: CategoryComparisonChartProps) {
  const sorted = [...data].sort((a, b) => b.annual - a.annual)
  return (
    <div style={{ height: sorted.length * 30 + 48 }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 20 }}>
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => `%${formatNumber(v, 0)}`}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Yıllık enflasyon (%)', position: 'insideBottom', offset: -12, fontSize: 11, fill: CHART_COLORS.axis }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={118}
            tick={{ fontSize: 11, fill: '#5b6b80' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgb(11 31 58 / 0.04)' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as CategoryInflation | undefined
              if (!row) return null
              return (
                <ChartTooltip
                  active={active}
                  title={`${row.code} · ${row.name}`}
                  rows={[
                    { label: 'Yıllık', value: formatPercent(row.annual), color: CHART_COLORS.navy },
                    { label: 'Aylık', value: formatPercent(row.monthly), color: CHART_COLORS.accent },
                    { label: 'Ağırlık', value: formatPercent(row.weight), color: CHART_COLORS.muted },
                  ]}
                  footer={row.annual > headline ? 'Genel enflasyonun üzerinde' : 'Genel enflasyonun altında'}
                />
              )
            }}
          />
          <ReferenceLine
            x={headline}
            stroke={CHART_COLORS.up}
            strokeDasharray="4 3"
            label={{ value: `Genel ${formatPercent(headline, 1)}`, position: 'top', fontSize: 10, fill: CHART_COLORS.up }}
          />
          <Bar
            dataKey="annual"
            radius={[0, 3, 3, 0]}
            maxBarSize={16}
            onClick={(entry) => onSelect?.((entry as unknown as CategoryInflation).code)}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            {sorted.map((row) => (
              <Cell
                key={row.code}
                fill={
                  selected === row.code
                    ? CHART_COLORS.accent
                    : row.annual > headline
                      ? CHART_COLORS.navy
                      : '#7d8ea6'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
