import type { CompanySummary } from '@intrinsiq/core'
import { cn } from '@intrinsiq/ui/cn'
import {
  formatCount,
  formatMillions,
  formatPercent,
  formatSignedPercent,
  notReported,
} from '@intrinsiq/ui/format'
import styles from './CompanyTable.module.css'

type CompanyTableProps = {
  companies: readonly CompanySummary[]
  fundName: string
}

const captionId = 'company-table-caption'

const CompanyTable = ({ companies, fundName }: CompanyTableProps) => (
  <div aria-labelledby={captionId} className={styles.scroller} role="region" tabIndex={0}>
    <table className={styles.table}>
      <caption className={styles.caption} id={captionId}>
        Latest reported quarter for each company in {fundName}
      </caption>
      <thead>
        <tr>
          <th scope="col">Company</th>
          <th scope="col">Sector</th>
          <th className={styles.numeric} scope="col">
            Revenue
          </th>
          <th className={styles.numeric} scope="col">
            Growth YoY
          </th>
          <th className={styles.numeric} scope="col">
            EBITDA margin
          </th>
          <th className={styles.numeric} scope="col">
            Headcount
          </th>
          <th scope="col">Last reported</th>
          <th className={styles.numeric} scope="col">
            Quarters missing
          </th>
        </tr>
      </thead>
      <tbody>
        {companies.map((company) => (
          <tr className={cn(company.latestQuarter === null && styles.silent)} key={company.id}>
            <th scope="row">{company.name}</th>
            <td>{company.sector}</td>
            <td className={styles.numeric}>{formatMillions(company.latestRevenue)}</td>
            <td
              className={cn(
                styles.numeric,
                company.revenueGrowthYoy !== null &&
                  (company.revenueGrowthYoy < 0 ? styles.negative : styles.positive),
              )}
            >
              {formatSignedPercent(company.revenueGrowthYoy)}
            </td>
            <td
              className={cn(
                styles.numeric,
                company.ebitdaMargin !== null && company.ebitdaMargin < 0 && styles.negative,
              )}
            >
              {formatPercent(company.ebitdaMargin)}
            </td>
            <td className={styles.numeric}>{formatCount(company.headcount)}</td>
            <td>{company.latestQuarter ?? 'Not reporting'}</td>
            <td className={styles.numeric}>
              {company.missingQuarters.length === 0
                ? notReported
                : formatCount(company.missingQuarters.length)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default CompanyTable
