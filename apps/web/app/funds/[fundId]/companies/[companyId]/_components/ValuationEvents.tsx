import type { CompanyQuarterPoint } from '@intrinsiq/core'
import { formatMillions } from '@intrinsiq/ui/format'
import styles from './ValuationEvents.module.css'

type ValuationEventsProps = {
  series: readonly CompanyQuarterPoint[]
}

const ValuationEvents = ({ series }: ValuationEventsProps) => {
  const events = series.filter((point) => point.valuation !== null)

  if (events.length === 0) {
    return <p className={styles.empty}>This company has never been valued.</p>
  }

  return (
    <ol className={styles.list}>
      {events.map((point) => (
        <li key={point.quarter}>
          <span className={styles.quarter}>{point.quarter}</span>
          <span className={styles.value}>{formatMillions(point.valuation)}</span>
        </li>
      ))}
    </ol>
  )
}

export default ValuationEvents
