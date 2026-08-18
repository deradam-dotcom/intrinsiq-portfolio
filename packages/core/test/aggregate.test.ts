import { buildPortfolio, toLikeForLikeGrowth } from '#aggregate'
import { describe, expect, it } from 'vitest'
import { companies, funds, kpis } from './feeds'

const portfolio = buildPortfolio(funds, companies, kpis)

const fundFor = (fundId: string) => {
  const fund = portfolio.funds.find((candidate) => candidate.summary.id === fundId)

  if (fund === undefined) {
    throw new Error(`fixture has no fund ${fundId}`)
  }

  return fund
}

const quarterOf = (fundId: string, quarter: string) => {
  const point = fundFor(fundId).timeseries.find((candidate) => candidate.quarter === quarter)

  if (point === undefined) {
    throw new Error(`fund ${fundId} has no quarter ${quarter}`)
  }

  return point
}

describe('fund size', () => {
  it('converts the one figure the vendor quotes in millions', () => {
    expect(fundFor('fund-001').summary.targetSizeUsd).toBe(352_000_000)
  })
})

describe('quarterly coverage', () => {
  it('counts the companies behind the revenue figure, not the ones that sent a row', () => {
    const quarter = quarterOf('fund-003', '2024-Q3')

    expect(quarter.revenue).toBe(195_096_446)
    expect(quarter.reportingCompanies).toBe(3)
    expect(quarter.totalCompanies).toBe(5)
  })

  it('shows coverage dropping in the quarter the total drops', () => {
    expect(quarterOf('fund-003', '2024-Q2').reportingCompanies).toBe(4)
    expect(quarterOf('fund-003', '2024-Q3').reportingCompanies).toBe(3)
  })

  it('names the companies behind the figure, and the count follows the names', () => {
    const quarter = quarterOf('fund-003', '2024-Q3')

    expect(quarter.reporting).toEqual(['co-010', 'co-011', 'co-012'])
    expect(quarter.reporting.length).toBe(quarter.reportingCompanies)
    expect(quarter.reporting).not.toContain('co-008')
    expect(quarter.reporting).not.toContain('co-009')
  })

  it('keeps a silent company in the denominator so the gap stays visible', () => {
    const quarter = quarterOf('fund-005', '2025-Q4')

    expect(quarter.totalCompanies).toBe(6)
    expect(quarter.reportingCompanies).toBe(5)
    expect(fundFor('fund-005').summary.companyCount).toBe(6)
  })
})

describe('growth on a like-for-like basis', () => {
  it('turns a phantom collapse into the increase that actually happened', () => {
    const current = quarterOf('fund-003', '2024-Q3')
    const previous = quarterOf('fund-003', '2024-Q2')
    const naive = current.revenue! / previous.revenue! - 1

    expect(naive).toBeCloseTo(195_096_446 / 303_203_988 - 1, 6)
    expect(naive).toBeLessThan(-0.35)

    expect(toLikeForLikeGrowth(fundFor('fund-003').companies, '2024-Q3', '2024-Q2')).toBeCloseTo(
      195_096_446 / 180_267_143 - 1,
      6,
    )
  })

  it('drops a company from the base as well as the numerator', () => {
    const held = fundFor('fund-003').companies
    const withoutSilentCompanies = held.filter((record) => record.summary.id !== 'co-009')

    expect(toLikeForLikeGrowth(held, '2024-Q3', '2024-Q2')).toBe(
      toLikeForLikeGrowth(withoutSilentCompanies, '2024-Q3', '2024-Q2'),
    )
  })

  it('declines to invent a rate when the two quarters share no company', () => {
    expect(toLikeForLikeGrowth(fundFor('fund-003').companies, '2024-Q3', '2019-Q1')).toBeNull()
  })

  it('measures the fund year on year over companies present in both quarters', () => {
    const summary = fundFor('fund-003').summary

    expect(summary.latestQuarter).toBe('2025-Q4')
    expect(summary.revenueGrowthYoy).toBeCloseTo(522_285_155 / 368_380_171 - 1, 6)
  })
})

describe('fund margin', () => {
  it('divides one company set by itself, not one set by another', () => {
    expect(fundFor('fund-001').summary.ebitdaMargin).toBeCloseTo(19_195_311 / 102_006_368, 6)
    expect(fundFor('fund-005').summary.ebitdaMargin).toBeCloseTo(-62_083_928 / 282_643_667, 6)
  })
})

describe('portfolio valuation', () => {
  it('adds up carried valuations and labels the total with the freshest one', () => {
    const valuation = fundFor('fund-003').summary.portfolioValuation

    expect(valuation?.value).toBe(
      500_976_042 + 2_031_828_323 + 203_662_070 + 1_833_134_031 + 155_001_003,
    )
    expect(valuation?.asOf).toBe('2025-Q4')
  })
})

describe('data quality', () => {
  it('reports what the pipeline had to repair', () => {
    expect(portfolio.dataQuality).toEqual({
      duplicatesResolved: 2,
      orphanKpiRows: 2,
      companiesWithoutKpis: 1,
    })
  })
})
