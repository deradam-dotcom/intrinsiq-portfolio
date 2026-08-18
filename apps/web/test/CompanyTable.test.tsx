import CompanyTable from '@/app/funds/[fundId]/_components/CompanyTable'
import CoverageStrip from '@/app/funds/[fundId]/_components/CoverageStrip'
import type { CompanySummary, FundQuarterPoint } from '@intrinsiq/core'
import { cleanup, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'

const company = (over: Partial<CompanySummary> & Pick<CompanySummary, 'id' | 'name'>) =>
  ({
    fundId: 'fund-003',
    sector: 'software',
    country: 'US',
    initialInvestmentYear: 2020,
    latestQuarter: '2025-Q4',
    latestRevenue: 81_364_739,
    revenueGrowthYoy: 0.12,
    ebitdaMargin: 0.08,
    headcount: 240,
    valuation: null,
    missingQuarters: [],
    ...over,
  }) satisfies CompanySummary

const companies = [
  company({ id: 'co-008', name: 'Cobalt Logistics', missingQuarters: ['2024-Q1', '2024-Q2'] }),
  company({
    id: 'co-021',
    name: 'Surge Technologies',
    latestQuarter: null,
    latestRevenue: null,
    revenueGrowthYoy: null,
    ebitdaMargin: null,
    headcount: null,
    missingQuarters: ['2025-Q3', '2025-Q4'],
  }),
]

afterEach(cleanup)

describe('the portfolio company table', () => {
  it('is a real table, so a screen reader can navigate it by column', () => {
    render(<CompanyTable companies={companies} fundName="Acme Growth Fund III" />)

    expect(screen.getByRole('table', { name: /Acme Growth Fund III/ })).toBeDefined()
    expect(screen.getByRole('columnheader', { name: 'EBITDA margin' })).toBeDefined()
    expect(screen.getByRole('rowheader', { name: 'Cobalt Logistics' })).toBeDefined()
  })

  it('says a company is not reporting rather than showing it as a zero', () => {
    render(<CompanyTable companies={companies} fundName="Acme Growth Fund III" />)

    expect(screen.getByText('Not reporting')).toBeDefined()
    expect(screen.queryByText('$0.0M')).toBeNull()
  })

  it('lets a keyboard reach the columns that sit past the right edge', () => {
    render(<CompanyTable companies={companies} fundName="Acme Growth Fund III" />)

    const region = screen.getByRole('region', { name: /Acme Growth Fund III/ })

    expect(region.tabIndex).toBe(0)
  })

  it('has no accessibility violations axe can find', async () => {
    const { container } = render(
      <CompanyTable companies={companies} fundName="Acme Growth Fund III" />,
    )
    const { violations } = await axe.run(container)

    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})

describe('the coverage strip', () => {
  const timeseries: FundQuarterPoint[] = [
    {
      quarter: '2024-Q2',
      revenue: 1,
      ebitda: 1,
      headcount: 1,
      reportingCompanies: 5,
      totalCompanies: 5,
    },
    {
      quarter: '2024-Q3',
      revenue: 1,
      ebitda: 1,
      headcount: 1,
      reportingCompanies: 3,
      totalCompanies: 5,
    },
  ]

  it('spells the shortfall out in figures, not only in colour', () => {
    render(<CoverageStrip timeseries={timeseries} />)

    expect(screen.getByText('3/5')).toBeDefined()
    expect(screen.getByText('5/5')).toBeDefined()
  })
})
