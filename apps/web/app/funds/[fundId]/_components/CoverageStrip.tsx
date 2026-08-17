import type { FundQuarterPoint } from '@intrinsiq/core'
import { cn } from '@intrinsiq/ui/cn'
import styles from './CoverageStrip.module.css'

type CoverageStripProps = {
  timeseries: readonly FundQuarterPoint[]
}

const tierOf = ({ reportingCompanies, totalCompanies }: FundQuarterPoint) => {
  if (reportingCompanies === totalCompanies) {
    return styles.complete
  }

  return reportingCompanies * 3 < totalCompanies * 2 ? styles.thin : styles.partial
}

const CoverageStrip = ({ timeseries }: CoverageStripProps) => (
  <ol className={styles.strip}>
    {timeseries.map((point) => (
      <li className={cn(tierOf(point))} key={point.quarter}>
        <span className={styles.quarter}>{point.quarter}</span>
        <span className={styles.count}>
          {point.reportingCompanies}/{point.totalCompanies}
        </span>
      </li>
    ))}
  </ol>
)

export default CoverageStrip
