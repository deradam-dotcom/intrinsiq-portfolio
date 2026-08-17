import { getFund } from '@/lib/portfolio'
import {
  formatCount,
  formatMillions,
  formatPercent,
  formatSignedPercent,
  notReported,
} from '@intrinsiq/ui/format'
import Breadcrumbs from '@intrinsiq/ui/Breadcrumbs'
import Icon from '@intrinsiq/ui/Icon'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CompanyTable from './_components/CompanyTable'
import CoverageStrip from './_components/CoverageStrip'
import styles from './page.module.css'

const strategyLabels: Record<string, string> = {
  private_equity: 'Private equity',
  venture_capital: 'Venture capital',
  private_credit: 'Private credit',
}

const statusLabels: Record<string, string> = {
  investing: 'Investing',
  post_investment: 'Post-investment',
}

export const generateMetadata = async ({
  params,
}: PageProps<'/funds/[fundId]'>): Promise<Metadata> => {
  const detail = await getFund((await params).fundId)

  return { title: detail?.fund.name ?? 'Fund not found' }
}

const FundPage = async ({ params }: PageProps<'/funds/[fundId]'>) => {
  const detail = await getFund((await params).fundId)

  if (detail === null) {
    notFound()
  }

  const { fund, companies, timeseries } = detail
  const latest = timeseries.find((point) => point.quarter === fund.latestQuarter)

  return (
    <>
      <Breadcrumbs
        items={[
          <Link href="/" key="funds">
            Funds
          </Link>,
          fund.name,
        ]}
      />
      <header className={styles.intro}>
        <h1>{fund.name}</h1>
        <p className={styles.meta}>
          {strategyLabels[fund.strategy] ?? fund.strategy} · Vintage {fund.vintageYear} ·{' '}
          {statusLabels[fund.status] ?? fund.status} · {formatCount(fund.companyCount)} companies
        </p>
      </header>
      <dl className={styles.kpis}>
        <div>
          <dt>
            <Icon name="revenue" />
            Latest revenue
          </dt>
          <dd>{formatMillions(fund.latestRevenue)}</dd>
          <dd className={styles.sub}>
            {formatSignedPercent(fund.revenueGrowthYoy)} year on year, like for like
          </dd>
        </div>
        <div>
          <dt>
            <Icon name="margin" />
            EBITDA margin
          </dt>
          <dd>{formatPercent(fund.ebitdaMargin)}</dd>
          <dd className={styles.sub}>
            over the companies reporting both figures in {fund.latestQuarter ?? notReported}
          </dd>
        </div>
        <div>
          <dt>
            <Icon name="valuation" />
            Portfolio valuation
          </dt>
          <dd>{formatMillions(fund.portfolioValuation?.value ?? null)}</dd>
          <dd className={styles.sub}>
            {fund.portfolioValuation === null
              ? 'never valued'
              : `as of ${fund.portfolioValuation.asOf}`}
          </dd>
        </div>
        <div>
          <dt>
            <Icon name="target" />
            Target size
          </dt>
          <dd>{formatMillions(fund.targetSizeUsd)}</dd>
          <dd className={styles.sub}>
            {latest === undefined
              ? 'no quarter reported'
              : `${latest.reportingCompanies} of ${latest.totalCompanies} reported in ${latest.quarter}`}
          </dd>
        </div>
      </dl>
      <h2 className={styles.sectionHeading}>Reporting coverage</h2>
      <p className={styles.note}>
        How many companies stood behind the fund total in each quarter. A quarter with fewer
        reporters is not a smaller fund — it is a smaller sample.
      </p>
      <CoverageStrip timeseries={timeseries} />
      <h2 className={styles.sectionHeading}>Portfolio companies</h2>
      <CompanyTable companies={companies} fundName={fund.name} />
    </>
  )
}

export default FundPage
