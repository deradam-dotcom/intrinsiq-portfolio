import { describeSeries } from '@/lib/chart'
import type { FundQuarterPoint } from '@intrinsiq/core'
import { describe, expect, it } from 'vitest'

const point = (quarter: string, revenue: number | null): FundQuarterPoint => ({
  quarter,
  revenue,
  ebitda: null,
  headcount: null,
  reportingCompanies: revenue === null ? 0 : 1,
  totalCompanies: 1,
})

describe('the chart description a screen reader hears', () => {
  it('names the span and the direction rather than the drawing technique', () => {
    const description = describeSeries([point('2024-Q1', 40_000_000), point('2024-Q2', 60_000_000)])

    expect(description).toContain('from 2024-Q1 to 2024-Q2')
    expect(description).toContain('$40.0M to $60.0M')
  })

  it('spans the reported quarters only, and names the ones that are missing', () => {
    const description = describeSeries([
      point('2024-Q1', 40_000_000),
      point('2024-Q2', null),
      point('2024-Q3', 60_000_000),
    ])

    expect(description).toContain('from 2024-Q1 to 2024-Q3')
    expect(description).toContain('No revenue was reported in 2024-Q2')
  })

  it('says so plainly when a fund has never reported', () => {
    expect(describeSeries([point('2024-Q1', null)])).toContain('No quarter has been reported')
  })
})
