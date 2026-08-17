import type { FundListing } from '@/lib/portfolio'
import {
  formatMillions,
  formatPercent,
  formatSignedPercent,
  notReported,
} from '@intrinsiq/ui/format'
import { cn } from '@intrinsiq/ui/cn'
import Sparkline from '@intrinsiq/ui/Sparkline'
import Link from 'next/link'
import styles from './FundCard.module.css'

type FundCardProps = {
  fund: FundListing
}

const strategyLabels: Record<FundListing['strategy'], string> = {
  private_equity: 'Private equity',
  venture_capital: 'Venture capital',
  private_credit: 'Private credit',
}

const statusLabels: Record<FundListing['status'], string> = {
  investing: 'Investing',
  post_investment: 'Post-investment',
}

const isLoss = (value: number | null) => value !== null && value < 0

const growthDirection = (growth: number | null) => {
  if (growth === null) {
    return { glyph: '', label: '', tone: styles.flat }
  }

  return growth < 0
    ? { glyph: '↓', label: 'decreased by', tone: styles.negative }
    : { glyph: '↑', label: 'increased by', tone: styles.positive }
}

const FundCard = ({ fund }: FundCardProps) => {
  const latest = fund.timeseries.find((point) => point.quarter === fund.latestQuarter)
  const growth = growthDirection(fund.revenueGrowthYoy)

  return (
    <li>
      <article className={styles.card}>
        <div className={styles.heading}>
          <h2>
            <Link href={`/funds/${fund.id}`}>{fund.name}</Link>
          </h2>
          <p className={styles.meta}>
            {strategyLabels[fund.strategy]} · Vintage {fund.vintageYear} ·{' '}
            {statusLabels[fund.status]}
          </p>
        </div>
        <dl className={styles.metrics}>
          <div>
            <dt>Latest revenue</dt>
            <dd className={styles.headline}>{formatMillions(fund.latestRevenue)}</dd>
            <dd className={cn(styles.growth, growth.tone)}>
              <span aria-hidden="true">{growth.glyph}</span>
              <span className={styles.visuallyHidden}>{growth.label}</span>
              {formatSignedPercent(fund.revenueGrowthYoy)} year on year
            </dd>
          </div>
          <div>
            <dt>EBITDA margin</dt>
            <dd className={cn(isLoss(fund.ebitdaMargin) && styles.negative)}>
              {formatPercent(fund.ebitdaMargin)}
            </dd>
          </div>
          <div>
            <dt>Portfolio valuation</dt>
            <dd>
              {fund.portfolioValuation === null
                ? notReported
                : `${formatMillions(fund.portfolioValuation.value)} as of ${fund.portfolioValuation.asOf}`}
            </dd>
          </div>
          <div>
            <dt>Target size</dt>
            <dd>{formatMillions(fund.targetSizeUsd)}</dd>
          </div>
        </dl>
        <Sparkline values={fund.timeseries.map((point) => point.revenue)} />
        {latest === undefined || latest.reportingCompanies === latest.totalCompanies ? null : (
          <p className={styles.coverage}>
            {latest.reportingCompanies} of {latest.totalCompanies} companies reported in{' '}
            {latest.quarter}
          </p>
        )}
        <div className={styles.roster}>
          <h3 className={styles.rosterHeading}>
            {fund.companies.length} portfolio{' '}
            {fund.companies.length === 1 ? 'company' : 'companies'}
          </h3>
          <ul>
            {fund.companies.map((company) => (
              <li className={cn(company.latestQuarter === null && styles.silent)} key={company.id}>
                {company.latestQuarter === null ? `${company.name} · not reporting` : company.name}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </li>
  )
}

export default FundCard
