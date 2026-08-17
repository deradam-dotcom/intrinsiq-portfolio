import styles from './Sparkline.module.css'
import { toSparklineRuns } from '#lib/plot'

type SparklineProps = {
  values: readonly (number | null)[]
}

const width = 120
const height = 32
const padding = 2

const Sparkline = ({ values }: SparklineProps) => {
  const runs = toSparklineRuns(values, width - padding * 2, height - padding * 2)

  return (
    <svg
      aria-hidden="true"
      className={styles.chart}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <g transform={`translate(${padding} ${padding})`}>
        {runs.map((run) =>
          run.length === 1 ? (
            <circle cx={run[0]?.x} cy={run[0]?.y} key={run[0]?.x} r="1.75" />
          ) : (
            <polyline
              key={run[0]?.x}
              points={run.map((point) => `${point.x},${point.y}`).join(' ')}
            />
          ),
        )}
      </g>
    </svg>
  )
}

export default Sparkline
