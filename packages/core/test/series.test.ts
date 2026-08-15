import { normalizeKpiFeed } from '#normalize'
import { buildQuarterGrid } from '#quarters'
import { buildCompanyRecord } from '#series'
import { describe, expect, it } from 'vitest'
import { companies, companyIds, kpis } from './feeds'

const feed = normalizeKpiFeed(kpis, companyIds)

const grid = buildQuarterGrid(feed.rows.map((row) => row.quarter))

const recordFor = (companyId: string) => {
  const company = companies.find((candidate) => candidate.id === companyId)

  if (company === undefined) {
    throw new Error(`fixture has no company ${companyId}`)
  }

  return buildCompanyRecord(
    company,
    feed.rows.filter((row) => row.companyId === companyId),
    grid,
  )
}

const pointIn = (companyId: string, quarter: string) =>
  recordFor(companyId).series.find((point) => point.quarter === quarter)

describe('a company with quarters missing from the middle of its history', () => {
  const { summary, series } = recordFor('co-008')

  it('still covers the full grid so it can be compared with its peers', () => {
    expect(series).toHaveLength(grid.length)
    expect(series.map((point) => point.quarter)).toEqual(grid)
  })

  it('leaves an unreported quarter null rather than zero', () => {
    expect(pointIn('co-008', '2024-Q2')).toEqual({
      quarter: '2024-Q2',
      revenue: null,
      ebitda: null,
      headcount: null,
      valuation: null,
    })
  })

  it('names the quarters that carried no row at all', () => {
    expect(summary.missingQuarters).toEqual(['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'])
  })

  it('has no year-on-year figure because the base quarter sits inside the gap', () => {
    expect(summary.latestQuarter).toBe('2025-Q4')
    expect(summary.latestRevenue).toBe(81_364_739)
    expect(summary.revenueGrowthYoy).toBeNull()
  })
})

describe('a company that filed a row but left a metric out of it', () => {
  it('counts as reporting, so a null metric is not mistaken for a missing quarter', () => {
    expect(recordFor('co-009').summary.missingQuarters).not.toContain('2024-Q3')
    expect(pointIn('co-009', '2024-Q3')).toEqual({
      quarter: '2024-Q3',
      revenue: null,
      ebitda: -37_281_499,
      headcount: 2687,
      valuation: null,
    })
  })
})

describe('a company that never reported anything', () => {
  const { summary, series } = recordFor('co-021')

  it('is still a company, with an empty series instead of an error', () => {
    expect(series).toHaveLength(grid.length)
    expect(series.every((point) => point.revenue === null)).toBe(true)
    expect(summary.name).toBe('Surge Technologies')
    expect(summary.fundId).toBe('fund-005')
  })

  it('reports nothing rather than reporting zero', () => {
    expect(summary.latestQuarter).toBeNull()
    expect(summary.latestRevenue).toBeNull()
    expect(summary.ebitdaMargin).toBeNull()
    expect(summary.valuation).toBeNull()
    expect(summary.missingQuarters).toEqual(grid)
  })
})

describe('valuation, which arrives on pricing events rather than quarterly', () => {
  it('carries the last known figure forward and says which quarter it came from', () => {
    expect(recordFor('co-014').summary.valuation).toEqual({
      value: 651_895_958,
      asOf: '2024-Q1',
    })
  })

  it('leaves the series itself unsmoothed, so the drill-down shows events not a staircase', () => {
    const reported = recordFor('co-014')
      .series.filter((point) => point.valuation !== null)
      .map((point) => point.quarter)

    expect(reported).toEqual(['2024-Q1'])
  })
})

describe('margins', () => {
  it('passes a loss straight through instead of treating it as bad data', () => {
    expect(recordFor('co-003').summary.ebitdaMargin).toBeCloseTo(-0.2618, 4)
  })

  it('declines to compute a margin with no revenue underneath it', () => {
    expect(recordFor('co-021').summary.ebitdaMargin).toBeNull()
  })
})
