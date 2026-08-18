'use client'

import type { CompanySummary, FundQuarterPoint } from '@intrinsiq/core'
import { cn } from '@intrinsiq/ui/cn'
import Popover from '@intrinsiq/ui/primitives/Popover'
import { useState } from 'react'
import styles from './CoverageStrip.module.css'

type CoverageStripProps = {
  timeseries: readonly FundQuarterPoint[]
  companies: readonly CompanySummary[]
}

const tierOf = ({ reportingCompanies, totalCompanies }: FundQuarterPoint) => {
  if (reportingCompanies === totalCompanies) {
    return styles.complete
  }

  return reportingCompanies * 3 < totalCompanies * 2 ? styles.thin : styles.partial
}

const CoverageStrip = ({ timeseries, companies }: CoverageStripProps) => {
  const [openQuarter, setOpenQuarter] = useState<string | null>(null)

  return (
    <ol className={styles.strip}>
      {timeseries.map((point) => {
        const reported = companies.filter((company) => point.reporting.includes(company.id))
        const silent = companies.filter((company) => !point.reporting.includes(company.id))

        return (
          <li
            className={cn(tierOf(point))}
            key={point.quarter}
            onMouseEnter={() => setOpenQuarter(point.quarter)}
            onMouseLeave={() => setOpenQuarter(null)}
          >
            <Popover
              className={styles.trigger}
              label={`Which companies reported in ${point.quarter}`}
              onOpenChange={(next) => setOpenQuarter(next ? point.quarter : null)}
              open={openQuarter === point.quarter}
              trigger={
                <>
                  <span className={styles.quarter}>{point.quarter}</span>
                  <span className={styles.count}>
                    {point.reportingCompanies}/{point.totalCompanies}
                  </span>
                </>
              }
            >
              <p className={styles.popoverHeading}>{point.quarter}</p>
              <p className={styles.popoverGroup}>Reported ({reported.length})</p>
              <ul className={styles.popoverList}>
                {reported.length === 0 ? <li>Nobody</li> : null}
                {reported.map((company) => (
                  <li key={company.id}>{company.name}</li>
                ))}
              </ul>
              {silent.length === 0 ? null : (
                <>
                  <p className={styles.popoverGroup}>Not reported ({silent.length})</p>
                  <ul className={cn(styles.popoverList, styles.silent)}>
                    {silent.map((company) => (
                      <li key={company.id}>{company.name}</li>
                    ))}
                  </ul>
                </>
              )}
            </Popover>
          </li>
        )
      })}
    </ol>
  )
}

export default CoverageStrip
