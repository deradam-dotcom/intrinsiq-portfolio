import styles from './Sparkline.module.css'
import { toSparklineRuns } from '#lib/plot'

type SparklineProps = {
  values: readonly (number | null)[]
}

const width = 120
const height = 32
const padding = 2
const gradientId = 'sparkline-stroke'

const Sparkline = ({ values }: SparklineProps) => {
  const runs = toSparklineRuns(values, width - padding * 2, height - padding * 2)

  return (
    <svg
      aria-hidden="true"
      className={styles.chart}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={gradientId}
          x1="0"
          x2="0"
          y1={height - padding * 2}
          y2="0"
        >
          <stop offset="0" />
          <stop offset="0.25" />
          <stop offset="0.5" />
          <stop offset="0.75" />
          <stop offset="1" />
        </linearGradient>
      </defs>
      <g transform={`translate(${padding} ${padding})`}>
        {runs.map((run) =>
          run.length === 1 ? (
            <circle cx={run[0]?.x} cy={run[0]?.y} key={run[0]?.x} r="1.75" />
          ) : (
            <polyline
              key={run[0]?.x}
              points={run.map((point) => `${point.x},${point.y}`).join(' ')}
              stroke={`url(#${gradientId})`}
            />
          ),
        )}
      </g>
    </svg>
  )
}

export default Sparkline
