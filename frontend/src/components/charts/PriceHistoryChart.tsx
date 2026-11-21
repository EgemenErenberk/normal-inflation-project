import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PriceObservation } from '@/types'
import { formatCurrency, formatDate, formatNumber, formatSignedPercent } from '@/lib/format'
import { CHART_COLORS, ChartTooltip, axisTickStyle } from './ChartTooltip'

const shortDate = new Intl.DateTimeFormat('tr-TR', { month: 'short', year: '2-digit' })

export function PriceHistoryChart({ data, unit }: { data: PriceObservation[]; unit: string }) {
  const first = data[0]?.price ?? 0
  const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="price-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.16} />
              <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => shortDate.format(new Date(d))}
            interval={tickInterval}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickMargin={8}
          />
          <YAxis
            tickFormatter={(v: number) => `₺${formatNumber(v, 0)}`}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            width={60}
            domain={['auto', 'auto']}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.muted }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as PriceObservation | undefined
              if (!row) return null
              return (
                <ChartTooltip
                  active={active}
                  title={formatDate(row.date)}
                  rows={[{ label: `Fiyat (${unit})`, value: formatCurrency(row.price), color: CHART_COLORS.accent }]}
                  footer={first ? `Dönem başına göre ${formatSignedPercent(((row.price - first) / first) * 100)}` : undefined}
                />
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            fill="url(#price-fill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
