import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { InflationPoint } from '@/types'
import { formatNumber, formatPercent, formatPeriod } from '@/lib/format'
import { CHART_COLORS, ChartTooltip, axisTickStyle } from './ChartTooltip'

export type TrendMetric = 'monthly' | 'annual' | 'index'

export const TREND_METRIC_LABELS: Record<TrendMetric, string> = {
  monthly: 'Aylık değişim',
  annual: 'Yıllık değişim',
  index: 'Endeks',
}

interface InflationTrendChartProps {
  data: InflationPoint[]
  metric: TrendMetric
  height?: number
}

export function InflationTrendChart({ data, metric, height = 340 }: InflationTrendChartProps) {
  const isPercent = metric !== 'index'
  const formatValue = (v: number) => (isPercent ? formatPercent(v) : formatNumber(v, 1))
  const tickInterval = Math.max(0, Math.ceil(data.length / 8) - 1)
  const average = data.length ? data.reduce((s, p) => s + p[metric], 0) / data.length : 0

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="period"
            tickFormatter={(p: string) => formatPeriod(p)}
            interval={tickInterval}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickMargin={8}
            label={{ value: 'Dönem', position: 'insideBottom', offset: -4, fontSize: 11, fill: CHART_COLORS.axis }}
            height={44}
          />
          <YAxis
            tickFormatter={(v: number) => (isPercent ? `%${formatNumber(v, metric === 'monthly' ? 1 : 0)}` : formatNumber(v, 0))}
            tick={axisTickStyle}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={metric === 'monthly' ? [0, 'auto'] : ['auto', 'auto']}
            label={{
              value: isPercent ? 'Değişim (%)' : 'Endeks (baz = 100)',
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              style: { textAnchor: 'middle', fontSize: 11, fill: CHART_COLORS.axis },
            }}
          />
          <Tooltip
            cursor={{ fill: 'rgb(11 31 58 / 0.04)', stroke: CHART_COLORS.muted }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as InflationPoint | undefined
              if (!point) return null
              return (
                <ChartTooltip
                  active={active}
                  title={formatPeriod(point.period, 'long')}
                  rows={[
                    { label: 'Aylık', value: formatPercent(point.monthly), color: metric === 'monthly' ? CHART_COLORS.navy : CHART_COLORS.muted },
                    { label: 'Yıllık', value: formatPercent(point.annual), color: metric === 'annual' ? CHART_COLORS.navy : CHART_COLORS.muted },
                    { label: 'Endeks', value: formatNumber(point.index, 2), color: metric === 'index' ? CHART_COLORS.navy : CHART_COLORS.muted },
                  ]}
                />
              )
            }}
          />
          <ReferenceLine
            y={average}
            stroke={CHART_COLORS.axis}
            strokeDasharray="4 4"
            label={{ value: `Ort. ${formatValue(average)}`, position: 'insideTopRight', fontSize: 10, fill: CHART_COLORS.axis }}
          />
          {metric === 'monthly' ? (
            <Bar dataKey="monthly" name="Aylık" fill={CHART_COLORS.navy} radius={[3, 3, 0, 0]} maxBarSize={28} />
          ) : (
            <Line
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLORS.navy}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
