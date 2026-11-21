import { useId } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  className?: string
}

/** Lightweight SVG sparkline – avoids mounting a full chart for tiny trend hints. */
export function Sparkline({ data, width = 96, height = 28, color = 'var(--color-navy)', fill = true, className }: SparklineProps) {
  const gradientId = useId()
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pad = 2
  const step = (width - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => [pad + i * step, pad + (height - pad * 2) * (1 - (v - min) / span)] as const)
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${points.at(-1)![0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`
  const [lx, ly] = points.at(-1)!

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.14} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2} fill={color} />
    </svg>
  )
}
