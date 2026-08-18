import { toEbitdaMargin, toGrowthRate } from '#metrics'
import { normalizeKpiFeed } from '#normalize'
import { buildQuarterGrid, quartersPerYear, shiftQuarter } from '#quarters'
import type { UpstreamCompany, UpstreamFund, UpstreamKpi } from '#schemas'
import { buildCompanyRecord, type CompanyRecord } from '#series'
import type { DataQualityReport, FundQuarterPoint, FundSummary, Valuation } from '#types'

export type FundRecord = {
  summary: FundSummary
  companies: CompanyRecord[]
  timeseries: FundQuarterPoint[]
}

export type Portfolio = {
  funds: FundRecord[]
  dataQuality: DataQualityReport
}

const usdPerMillion = 1_000_000

const sumReported = (values: readonly (number | null)[]): number | null => {
  const reported = values.filter((value) => value !== null)

  return reported.length === 0 ? null : reported.reduce((total, value) => total + value, 0)
}

const revenueIn = (record: CompanyRecord, quarter: string) =>
  record.series.find((point) => point.quarter === quarter)?.revenue ?? null

const ebitdaIn = (record: CompanyRecord, quarter: string) =>
  record.series.find((point) => point.quarter === quarter)?.ebitda ?? null

const headcountIn = (record: CompanyRecord, quarter: string) =>
  record.series.find((point) => point.quarter === quarter)?.headcount ?? null

const buildFundTimeseries = (
  records: readonly CompanyRecord[],
  grid: readonly string[],
): FundQuarterPoint[] =>
  grid.map((quarter) => {
    const reporting = records
      .filter((record) => revenueIn(record, quarter) !== null)
      .map((record) => record.summary.id)

    return {
      quarter,
      revenue: sumReported(records.map((record) => revenueIn(record, quarter))),
      ebitda: sumReported(records.map((record) => ebitdaIn(record, quarter))),
      headcount: sumReported(records.map((record) => headcountIn(record, quarter))),
      reporting,
      reportingCompanies: reporting.length,
      totalCompanies: records.length,
    }
  })

export const toLikeForLikeGrowth = (
  records: readonly CompanyRecord[],
  quarter: string,
  base: string,
): number | null => {
  const comparable = records.filter(
    (record) => revenueIn(record, quarter) !== null && revenueIn(record, base) !== null,
  )

  return toGrowthRate(
    sumReported(comparable.map((record) => revenueIn(record, quarter))),
    sumReported(comparable.map((record) => revenueIn(record, base))),
  )
}

const toFundEbitdaMargin = (records: readonly CompanyRecord[], quarter: string): number | null => {
  const comparable = records.filter(
    (record) => revenueIn(record, quarter) !== null && ebitdaIn(record, quarter) !== null,
  )

  return toEbitdaMargin(
    sumReported(comparable.map((record) => revenueIn(record, quarter))),
    sumReported(comparable.map((record) => ebitdaIn(record, quarter))),
  )
}

const toPortfolioValuation = (records: readonly CompanyRecord[]): Valuation | null => {
  const carried = records
    .map((record) => record.summary.valuation)
    .filter((valuation) => valuation !== null)

  if (carried.length === 0) {
    return null
  }

  return {
    value: carried.reduce((total, valuation) => total + valuation.value, 0),
    asOf: carried.reduce(
      (latest, valuation) => (valuation.asOf > latest ? valuation.asOf : latest),
      '',
    ),
  }
}

const summariseFund = (
  fund: UpstreamFund,
  records: readonly CompanyRecord[],
  timeseries: readonly FundQuarterPoint[],
): FundSummary => {
  const latest = timeseries.findLast((point) => point.reportingCompanies > 0) ?? null
  const base = latest === null ? null : shiftQuarter(latest.quarter, -quartersPerYear)

  return {
    id: fund.id,
    name: fund.name,
    strategy: fund.strategy,
    vintageYear: fund.vintageYear,
    status: fund.status,
    targetSizeUsd: fund.targetSizeMillionsUsd * usdPerMillion,
    companyCount: records.length,
    latestQuarter: latest?.quarter ?? null,
    latestRevenue: latest?.revenue ?? null,
    revenueGrowthYoy:
      latest === null || base === null ? null : toLikeForLikeGrowth(records, latest.quarter, base),
    ebitdaMargin: latest === null ? null : toFundEbitdaMargin(records, latest.quarter),
    portfolioValuation: toPortfolioValuation(records),
  }
}

export const buildPortfolio = (
  funds: readonly UpstreamFund[],
  companies: readonly UpstreamCompany[],
  kpis: readonly UpstreamKpi[],
): Portfolio => {
  const feed = normalizeKpiFeed(kpis, new Set(companies.map((company) => company.id)))
  const grid = buildQuarterGrid(feed.rows.map((row) => row.quarter))

  const records = companies.map((company) =>
    buildCompanyRecord(
      company,
      feed.rows.filter((row) => row.companyId === company.id),
      grid,
    ),
  )

  return {
    funds: funds.map((fund) => {
      const held = records.filter((record) => record.summary.fundId === fund.id)
      const timeseries = buildFundTimeseries(held, grid)

      return { summary: summariseFund(fund, held, timeseries), companies: held, timeseries }
    }),
    dataQuality: {
      duplicatesResolved: feed.duplicatesResolved,
      orphanKpiRows: feed.orphanKpiRows,
      companiesWithoutKpis: records.filter((record) => record.summary.latestQuarter === null)
        .length,
    },
  }
}
