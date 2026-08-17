import FundCard from '@/app/FundCard'
import styles from '@/app/page.module.css'
import { getFunds } from '@/lib/portfolio'
import { formatCount, formatMillions } from '@intrinsiq/ui/format'

const sumReported = (values: readonly (number | null)[]) =>
  values.filter((value) => value !== null).reduce((total, value) => total + value, 0)

const HomePage = async () => {
  const { funds, dataQuality } = await getFunds()

  const companyCount = funds.reduce((total, fund) => total + fund.companyCount, 0)
  const latestRevenue = sumReported(funds.map((fund) => fund.latestRevenue))
  const latestQuarter = funds
    .map((fund) => fund.latestQuarter)
    .filter((quarter) => quarter !== null)

  return (
    <>
      <header className={styles.intro}>
        <h1>Portfolio overview</h1>
        <p>
          Fund performance aggregated from the companies underneath, measured like for like so a
          quarter with missing filings does not read as a collapse.
        </p>
      </header>

      <dl className={styles.summary}>
        <div>
          <dt>Funds</dt>
          <dd>{formatCount(funds.length)}</dd>
        </div>
        <div>
          <dt>Portfolio companies</dt>
          <dd>{formatCount(companyCount)}</dd>
        </div>
        <div>
          <dt>Revenue in {latestQuarter.at(-1) ?? 'the latest quarter'}</dt>
          <dd>{formatMillions(latestRevenue)}</dd>
        </div>
        <div>
          <dt>Companies not reporting</dt>
          <dd>{formatCount(dataQuality.companiesWithoutKpis)}</dd>
        </div>
      </dl>

      <h2 className={styles.listHeading}>Funds</h2>
      <ul className={styles.grid}>
        {funds.map((fund) => (
          <FundCard fund={fund} key={fund.id} />
        ))}
      </ul>

      <p className={styles.footnote}>
        The pipeline resolved {dataQuality.duplicatesResolved} restated quarters and dropped{' '}
        {dataQuality.orphanKpiRows} KPI rows belonging to companies that are not in the portfolio.
      </p>
    </>
  )
}

export default HomePage
