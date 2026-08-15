import { toEbitdaMargin, toGrowthRate } from '#metrics'
import { quartersPerYear, shiftQuarter } from '#quarters'
import type { UpstreamCompany, UpstreamKpi } from '#schemas'
import type { CompanyQuarterPoint, CompanySummary, Valuation } from '#types'

export type CompanyRecord = {
  summary: CompanySummary
  series: CompanyQuarterPoint[]
}

export const buildCompanySeries = (
  rows: readonly UpstreamKpi[],
  grid: readonly string[],
): CompanyQuarterPoint[] => {
  const byQuarter = new Map(rows.map((row) => [row.quarter, row]))

  return grid.map((quarter) => {
    const reported = byQuarter.get(quarter)

    return {
      quarter,
      revenue: reported?.revenue ?? null,
      ebitda: reported?.ebitda ?? null,
      headcount: reported?.headcount ?? null,
      valuation: reported?.valuation ?? null,
    }
  })
}

export const carryValuationForward = (series: readonly CompanyQuarterPoint[]): Valuation | null =>
  series.reduce<Valuation | null>(
    (carried, point) =>
      point.valuation === null ? carried : { value: point.valuation, asOf: point.quarter },
    null,
  )

export const buildCompanyRecord = (
  company: UpstreamCompany,
  rows: readonly UpstreamKpi[],
  grid: readonly string[],
): CompanyRecord => {
  const series = buildCompanySeries(rows, grid)
  const reportedQuarters = new Set(rows.map((row) => row.quarter))
  const pointAt = (quarter: string | null) =>
    series.find((point) => point.quarter === quarter) ?? null

  const latestQuarter = grid.findLast((quarter) => reportedQuarters.has(quarter)) ?? null
  const latest = pointAt(latestQuarter)
  const yearAgo = pointAt(
    latestQuarter === null ? null : shiftQuarter(latestQuarter, -quartersPerYear),
  )

  return {
    summary: {
      id: company.id,
      fundId: company.fundId,
      name: company.name,
      sector: company.sector,
      country: company.country,
      initialInvestmentYear: company.initialInvestmentYear,
      latestQuarter,
      latestRevenue: latest?.revenue ?? null,
      revenueGrowthYoy: toGrowthRate(latest?.revenue ?? null, yearAgo?.revenue ?? null),
      ebitdaMargin: toEbitdaMargin(latest?.revenue ?? null, latest?.ebitda ?? null),
      headcount: latest?.headcount ?? null,
      valuation: carryValuationForward(series),
      missingQuarters: grid.filter((quarter) => !reportedQuarters.has(quarter)),
    },
    series,
  }
}
