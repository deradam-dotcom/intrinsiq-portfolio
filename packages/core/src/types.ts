import type { FundStatus, FundStrategy } from '#schemas'

export type Valuation = {
  value: number
  asOf: string
}

export type CompanyQuarterPoint = {
  quarter: string
  revenue: number | null
  ebitda: number | null
  headcount: number | null
  valuation: number | null
}

export type CompanySummary = {
  id: string
  fundId: string
  name: string
  sector: string
  country: string
  initialInvestmentYear: number
  latestQuarter: string | null
  latestRevenue: number | null
  revenueGrowthYoy: number | null
  ebitdaMargin: number | null
  headcount: number | null
  valuation: Valuation | null
  missingQuarters: string[]
}

export type FundQuarterPoint = {
  quarter: string
  revenue: number | null
  ebitda: number | null
  headcount: number | null
  reportingCompanies: number
  totalCompanies: number
}

export type FundSummary = {
  id: string
  name: string
  strategy: FundStrategy
  vintageYear: number
  status: FundStatus
  targetSizeUsd: number
  companyCount: number
  latestQuarter: string | null
  latestRevenue: number | null
  revenueGrowthYoy: number | null
  ebitdaMargin: number | null
  portfolioValuation: Valuation | null
}

export type DataQualityReport = {
  duplicatesResolved: number
  orphanKpiRows: number
  companiesWithoutKpis: number
}
