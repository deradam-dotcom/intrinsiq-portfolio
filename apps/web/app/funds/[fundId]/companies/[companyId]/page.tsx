import KpiChart from '@/app/funds/[fundId]/_components/KpiChart'
import { getCompany, getFund } from '@/lib/portfolio'
import Breadcrumbs from '@intrinsiq/ui/Breadcrumbs'
import {
  formatCount,
  formatMillions,
  formatPercent,
  formatSignedPercent,
  notReported,
} from '@intrinsiq/ui/format'
import Icon from '@intrinsiq/ui/Icon'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ValuationEvents from './_components/ValuationEvents'
import styles from './page.module.css'

export const generateMetadata = async ({
  params,
}: PageProps<'/funds/[fundId]/companies/[companyId]'>): Promise<Metadata> => {
  const detail = await getCompany((await params).companyId)

  return { title: detail?.company.name ?? 'Company not found' }
}

const CompanyPage = async ({ params }: PageProps<'/funds/[fundId]/companies/[companyId]'>) => {
  const { fundId, companyId } = await params
  const [detail, fund] = await Promise.all([getCompany(companyId), getFund(fundId)])

  if (detail === null || fund === null || detail.company.fundId !== fundId) {
    notFound()
  }

  const { company, series } = detail
  const reported = series.filter((point) => point.revenue !== null)

  return (
    <>
      <Breadcrumbs
        items={[
          <Link href="/" key="funds">
            Funds
          </Link>,
          <Link href={`/funds/${fundId}`} key="fund">
            {fund.fund.name}
          </Link>,
          company.name,
        ]}
      />
      <header className={styles.intro}>
        <h1>{company.name}</h1>
        <p className={styles.meta}>
          {company.sector} · {company.country} · First invested {company.initialInvestmentYear}
        </p>
      </header>
      {company.latestQuarter === null ? (
        <p className={styles.silent}>
          No KPIs have been reported for this company. It is held by {fund.fund.name} and counts
          towards the fund, but no quarter carries a figure — so the fund total below never rested
          on it.
        </p>
      ) : (
        <dl className={styles.kpis}>
          <div>
            <dt>
              <Icon name="revenue" />
              Revenue in {company.latestQuarter}
            </dt>
            <dd>{formatMillions(company.latestRevenue)}</dd>
            <dd className={styles.sub}>
              {formatSignedPercent(company.revenueGrowthYoy)} year on year
            </dd>
          </div>
          <div>
            <dt>
              <Icon name="margin" />
              EBITDA margin
            </dt>
            <dd>{formatPercent(company.ebitdaMargin)}</dd>
            <dd className={styles.sub}>on the revenue reported that quarter</dd>
          </div>
          <div>
            <dt>
              <Icon name="companies" />
              Headcount
            </dt>
            <dd>{formatCount(company.headcount)}</dd>
            <dd className={styles.sub}>as last filed</dd>
          </div>
          <div>
            <dt>
              <Icon name="valuation" />
              Valuation
            </dt>
            <dd>{formatMillions(company.valuation?.value ?? null)}</dd>
            <dd className={styles.sub}>
              {company.valuation === null ? 'never valued' : `as of ${company.valuation.asOf}`}
            </dd>
          </div>
        </dl>
      )}
      <h2 className={styles.sectionHeading}>Revenue and EBITDA</h2>
      <p className={styles.note}>
        Every quarter on the same grid the fund is measured on, so a break in a line is a quarter
        this company did not file — never a zero.{' '}
        {company.missingQuarters.length === 0
          ? 'It filed in all of them.'
          : `It reported in ${reported.length} of ${series.length} quarters; ${company.missingQuarters.join(', ')} carry nothing.`}
      </p>
      <KpiChart points={series} />
      <h2 className={styles.sectionHeading}>Valuation events</h2>
      <p className={styles.note}>
        A valuation comes from a pricing event, not from the calendar, so these are the quarters one
        actually happened in — not a figure carried forward into every quarter. The headline above
        shows the last of them{company.valuation === null ? '' : `, from ${company.valuation.asOf}`}
        .
      </p>
      <ValuationEvents series={series} />
      <p className={styles.footnote}>
        Held by{' '}
        <Link className={styles.link} href={`/funds/${fundId}`}>
          {fund.fund.name}
        </Link>
        {company.latestQuarter === null ? '' : `, last reporting in ${company.latestQuarter}`}.{' '}
        {notReported} marks a figure the vendor never sent.
      </p>
    </>
  )
}

export default CompanyPage
