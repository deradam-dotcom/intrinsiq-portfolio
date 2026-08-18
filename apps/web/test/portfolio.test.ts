import type { FundQuarterPoint } from '@intrinsiq/core'
import type { FundListing } from '@/lib/portfolio'
import { filterFunds, latestPortfolioRevenue, sortFunds } from '@/lib/portfolio'
import { describe, expect, it } from 'vitest'

const fund = (over: Partial<FundListing> & Pick<FundListing, 'id'>): FundListing => ({
  name: over.id,
  strategy: 'private_equity',
  vintageYear: 2020,
  status: 'investing',
  targetSizeUsd: 100_000_000,
  companyCount: 1,
  latestQuarter: '2025-Q4',
  latestRevenue: 0,
  revenueGrowthYoy: 0,
  ebitdaMargin: 0,
  portfolioValuation: null,
  companies: [],
  timeseries: [],
  ...over,
})

const ids = (funds: readonly FundListing[]) => funds.map((candidate) => candidate.id)

const point = (quarter: string, revenue: number | null): FundQuarterPoint => ({
  quarter,
  revenue,
  ebitda: null,
  headcount: null,
  reporting: revenue === null ? [] : ['co-1'],
  reportingCompanies: revenue === null ? 0 : 1,
  totalCompanies: 1,
})

describe('filtering the fund list', () => {
  const funds = [
    fund({ id: 'a', strategy: 'venture_capital', status: 'investing' }),
    fund({ id: 'b', strategy: 'private_credit', status: 'post_investment' }),
    fund({ id: 'c', strategy: 'venture_capital', status: 'post_investment' }),
  ]

  it('keeps everything when neither filter is set', () => {
    expect(ids(filterFunds(funds, 'all', 'all'))).toEqual(['a', 'b', 'c'])
  })

  it('narrows on each axis, and on both at once', () => {
    expect(ids(filterFunds(funds, 'venture_capital', 'all'))).toEqual(['a', 'c'])
    expect(ids(filterFunds(funds, 'all', 'post_investment'))).toEqual(['b', 'c'])
    expect(ids(filterFunds(funds, 'venture_capital', 'post_investment'))).toEqual(['c'])
  })

  it('returns nothing rather than everything when the pair matches no fund', () => {
    expect(filterFunds(funds, 'private_credit', 'investing')).toEqual([])
  })
})

describe('the portfolio revenue headline', () => {
  const current = fund({
    id: 'current',
    latestQuarter: '2025-Q4',
    timeseries: [point('2025-Q2', 40), point('2025-Q4', 100)],
  })

  const lagging = fund({
    id: 'lagging',
    latestQuarter: '2025-Q2',
    latestRevenue: 50,
    timeseries: [point('2025-Q2', 50), point('2025-Q4', null)],
  })

  it('names the newest quarter any fund reached, not the last fund in the list', () => {
    expect(latestPortfolioRevenue([current, lagging]).quarter).toBe('2025-Q4')
    expect(latestPortfolioRevenue([lagging, current]).quarter).toBe('2025-Q4')
  })

  it('sums that quarter only, so a fund that stopped filing cannot inflate it', () => {
    expect(latestPortfolioRevenue([current, lagging]).revenue).toBe(100)
  })

  it('adds every fund up when they all reached the same quarter', () => {
    const peer = fund({ id: 'peer', timeseries: [point('2025-Q4', 25)] })

    expect(latestPortfolioRevenue([current, peer]).revenue).toBe(125)
  })

  it('reports nothing rather than zero when no fund has filed', () => {
    const quiet = fund({ id: 'quiet', latestQuarter: null, latestRevenue: null })

    expect(latestPortfolioRevenue([quiet])).toEqual({ quarter: null, revenue: null })
  })
})

describe('sorting the fund list', () => {
  const funds = [
    fund({ id: 'small', name: 'Zulu', latestRevenue: 10, targetSizeUsd: 1, revenueGrowthYoy: 0.5 }),
    fund({ id: 'big', name: 'Alpha', latestRevenue: 30, targetSizeUsd: 3, revenueGrowthYoy: 0.1 }),
    fund({
      id: 'quiet',
      name: 'Mike',
      latestRevenue: null,
      targetSizeUsd: 2,
      revenueGrowthYoy: null,
    }),
  ]

  it('puts the largest figure first, whichever figure is chosen', () => {
    expect(ids(sortFunds(funds, 'revenue'))).toEqual(['big', 'small', 'quiet'])
    expect(ids(sortFunds(funds, 'size'))).toEqual(['big', 'quiet', 'small'])
    expect(ids(sortFunds(funds, 'growth'))).toEqual(['small', 'big', 'quiet'])
  })

  it('sinks a fund that reported nothing instead of ranking it as zero', () => {
    expect(ids(sortFunds(funds, 'revenue')).at(-1)).toBe('quiet')
    expect(ids(sortFunds(funds, 'growth')).at(-1)).toBe('quiet')
  })

  it('sorts by name in the direction a reader expects', () => {
    expect(ids(sortFunds(funds, 'name'))).toEqual(['big', 'quiet', 'small'])
  })

  it('leaves the caller its own array', () => {
    const original = ids(funds)

    sortFunds(funds, 'name')

    expect(ids(funds)).toEqual(original)
  })
})
