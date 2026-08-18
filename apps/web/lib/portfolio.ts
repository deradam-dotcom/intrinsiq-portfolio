import 'server-only'
import type {
  CompanyQuarterPoint,
  CompanySummary,
  DataQualityReport,
  FundQuarterPoint,
  FundSummary,
} from '@intrinsiq/core'
import { headers } from 'next/headers'

export type FundListing = FundSummary & {
  companies: { id: string; name: string; latestQuarter: string | null }[]
  timeseries: FundQuarterPoint[]
}

export type FundDetail = {
  fund: FundSummary
  companies: CompanySummary[]
  timeseries: FundQuarterPoint[]
}

export type CompanyDetail = {
  company: CompanySummary
  series: CompanyQuarterPoint[]
}

export type FundsResponse = {
  funds: FundListing[]
  dataQuality: DataQualityReport
}

const toAbsolute = async (path: string) => {
  const incoming = await headers()
  const host = incoming.get('host') ?? 'localhost:3000'
  const protocol = incoming.get('x-forwarded-proto') ?? 'http'

  return `${protocol}://${host}${path}`
}

export const filterFunds = (
  funds: readonly FundListing[],
  strategy: string,
  status: string,
): FundListing[] =>
  funds.filter(
    (fund) =>
      (strategy === 'all' || fund.strategy === strategy) &&
      (status === 'all' || fund.status === status),
  )

export const sortFunds = (funds: readonly FundListing[], sort: string): FundListing[] =>
  [...funds].sort((left, right) => {
    if (sort === 'name') {
      return left.name.localeCompare(right.name)
    }

    if (sort === 'size') {
      return right.targetSizeUsd - left.targetSizeUsd
    }

    if (sort === 'growth') {
      return (right.revenueGrowthYoy ?? -Infinity) - (left.revenueGrowthYoy ?? -Infinity)
    }

    return (right.latestRevenue ?? -Infinity) - (left.latestRevenue ?? -Infinity)
  })

export const latestPortfolioRevenue = (funds: readonly FundListing[]) => {
  const quarter =
    funds
      .map((fund) => fund.latestQuarter)
      .filter((value) => value !== null)
      .sort()
      .at(-1) ?? null

  if (quarter === null) {
    return { quarter, revenue: null }
  }

  const reported = funds
    .map((fund) => fund.timeseries.find((point) => point.quarter === quarter)?.revenue ?? null)
    .filter((value) => value !== null)

  return {
    quarter,
    revenue: reported.length === 0 ? null : reported.reduce((total, value) => total + value, 0),
  }
}

export const getFunds = async (): Promise<FundsResponse> => {
  const response = await fetch(await toAbsolute('/api/funds'))

  if (!response.ok) {
    throw new Error(`The portfolio API answered ${response.status}.`)
  }

  return response.json()
}

export const getFund = async (fundId: string): Promise<FundDetail | null> => {
  const response = await fetch(await toAbsolute(`/api/funds/${encodeURIComponent(fundId)}`))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`The portfolio API answered ${response.status}.`)
  }

  return response.json()
}

export const getCompany = async (companyId: string): Promise<CompanyDetail | null> => {
  const response = await fetch(await toAbsolute(`/api/companies/${encodeURIComponent(companyId)}`))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`The portfolio API answered ${response.status}.`)
  }

  return response.json()
}
