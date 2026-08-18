'use client'

import type { TrendPoint } from '@/lib/chart'
import { describeSeries } from '@/lib/chart'
import { formatMillions, notReported } from '@intrinsiq/ui/format'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styles from './KpiChart.module.css'

type KpiChartProps = {
  points: readonly TrendPoint[]
}

const gradientId = 'kpi-line-stroke'

const KpiChart = ({ points }: KpiChartProps) => (
  <figure className={styles.figure}>
    <div aria-label={describeSeries(points)} className={styles.canvas} role="img">
      <div aria-hidden="true" className={styles.plot}>
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={[...points]} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="1" y2="0">
                <stop offset="0" />
                <stop offset="0.25" />
                <stop offset="0.5" />
                <stop offset="0.75" />
                <stop offset="1" />
              </linearGradient>
            </defs>
            <CartesianGrid className={styles.grid} horizontal vertical={false} />
            <XAxis axisLine={false} dataKey="quarter" tickLine={false} tickMargin={10} />
            <YAxis
              axisLine={false}
              tickFormatter={(value: number) => formatMillions(value)}
              tickLine={false}
              width={80}
            />
            <ReferenceLine className={styles.zero} y={0} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontVariantNumeric: 'tabular-nums',
              }}
              formatter={(value: unknown) =>
                typeof value === 'number' ? formatMillions(value) : notReported
              }
              itemStyle={{ color: 'var(--color-text)' }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Line
              connectNulls={false}
              dataKey="revenue"
              dot={{ fill: 'currentColor', r: 3, strokeWidth: 0 }}
              name="Revenue"
              stroke={`url(#${gradientId})`}
              strokeWidth={2}
              type="linear"
            />
            <Line
              connectNulls={false}
              dataKey="ebitda"
              dot={{ fill: 'currentColor', r: 3, strokeWidth: 0 }}
              name="EBITDA"
              stroke={`url(#${gradientId})`}
              strokeDasharray="5 4"
              strokeWidth={2}
              type="linear"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    <figcaption className={styles.legend}>
      <span>Revenue</span>
      <span className={styles.ebitdaKey}>EBITDA</span>
    </figcaption>
    <table className={styles.equivalent}>
      <caption>Revenue and EBITDA by quarter, in figures</caption>
      <thead>
        <tr>
          <th scope="col">Quarter</th>
          <th scope="col">Revenue</th>
          <th scope="col">EBITDA</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.quarter}>
            <th scope="row">{point.quarter}</th>
            <td>{point.revenue === null ? notReported : formatMillions(point.revenue)}</td>
            <td>{point.ebitda === null ? notReported : formatMillions(point.ebitda)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </figure>
)

export default KpiChart
