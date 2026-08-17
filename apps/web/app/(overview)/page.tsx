import FundCard from './_components/FundCard'
import FundFilters from './_components/FundFilters'
import { cn } from '@intrinsiq/ui/cn'
import Icon from '@intrinsiq/ui/Icon'
import styles from './page.module.css'
import { filterFunds, getFunds, sortFunds } from '@/lib/portfolio'
import { formatCount, formatMillions } from '@intrinsiq/ui/format'

const sumReported = (values: readonly (number | null)[]) =>
  values.filter((value) => value !== null).reduce((total, value) => total + value, 0)

const HomePage = async ({ searchParams }: PageProps<'/'>) => {
  const { funds, dataQuality } = await getFunds()
  const { strategy = 'all', status = 'all', sort = 'revenue' } = await searchParams
  const shown = sortFunds(filterFunds(funds, String(strategy), String(status)), String(sort))

  const companyCount = funds.reduce((total, fund) => total + fund.companyCount, 0)
  const latestRevenue = sumReported(funds.map((fund) => fund.latestRevenue))
  const latestQuarter = funds
    .map((fund) => fund.latestQuarter)
    .filter((quarter) => quarter !== null)
  const silent = funds.flatMap((fund) =>
    fund.companies.filter((company) => company.latestQuarter === null),
  )

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
          <dt>
            <Icon name="funds" />
            Funds
          </dt>
          <dd>{formatCount(funds.length)}</dd>
        </div>
        <div>
          <dt>
            <Icon name="companies" />
            Portfolio companies
          </dt>
          <dd>{formatCount(companyCount)}</dd>
        </div>
        <div>
          <dt>
            <Icon name="revenue" />
            Revenue in {latestQuarter.at(-1) ?? 'the latest quarter'}
          </dt>
          <dd>{formatMillions(latestRevenue)}</dd>
        </div>
        <div className={cn(dataQuality.companiesWithoutKpis > 0 && styles.flagged)}>
          <dt>
            <Icon name="gap" />
            Companies not reporting
          </dt>
          <dd className={styles.withNames}>
            {formatCount(dataQuality.companiesWithoutKpis)}
            {silent.length === 0 ? null : (
              <span className={styles.names}>
                <span className={styles.name}>{silent[0]?.name}</span>
                {silent.length === 1 ? null : (
                  <span className={styles.more}>+{silent.length - 1} more</span>
                )}
              </span>
            )}
          </dd>
        </div>
      </dl>
      <h2 className={styles.listHeading}>Funds</h2>
      <FundFilters
        shown={shown.length}
        sort={String(sort)}
        status={String(status)}
        strategy={String(strategy)}
        total={funds.length}
      />
      {shown.length === 0 ? (
        <p className={styles.empty}>No fund matches these filters.</p>
      ) : (
        <ul className={styles.grid}>
          {shown.map((fund) => (
            <FundCard fund={fund} key={fund.id} />
          ))}
        </ul>
      )}
      <p className={styles.footnote}>
        The pipeline resolved {dataQuality.duplicatesResolved} restated quarters and dropped{' '}
        {dataQuality.orphanKpiRows} KPI rows belonging to companies that are not in the portfolio.
      </p>
    </>
  )
}

export default HomePage
