import CompanyTable from '@/app/funds/[fundId]/_components/CompanyTable'
import CoverageStrip from '@/app/funds/[fundId]/_components/CoverageStrip'
import KpiChart from '@/app/funds/[fundId]/_components/KpiChart'
import type { CompanySummary, FundQuarterPoint } from '@intrinsiq/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
      reporting: ['co-008', 'co-021', 'c', 'd', 'e'],
      reportingCompanies: 5,
      totalCompanies: 5,
    },
    {
      quarter: '2024-Q3',
      revenue: 1,
      ebitda: 1,
      headcount: 1,
      reporting: ['c', 'd', 'e'],
      reportingCompanies: 3,
      totalCompanies: 5,
    },
  ]

  it('spells the shortfall out in figures, not only in colour', () => {
    render(<CoverageStrip companies={companies} timeseries={timeseries} />)

    expect(screen.getByText('3/5')).toBeDefined()
    expect(screen.getByText('5/5')).toBeDefined()
  })

  it('offers each quarter as a button, so the names are not locked behind a hover', () => {
    render(<CoverageStrip companies={companies} timeseries={timeseries} />)

    expect(
      screen.getByRole('button', { name: /Which companies reported in 2024-Q3/ }),
    ).toBeDefined()
  })

  it('names the companies behind the quarter once it is opened', () => {
    render(<CoverageStrip companies={companies} timeseries={timeseries} />)
    fireEvent.click(screen.getByRole('button', { name: /reported in 2024-Q3/ }))

    expect(screen.getByText('Not reported (2)')).toBeDefined()
    expect(screen.getByText('Cobalt Logistics')).toBeDefined()
    expect(screen.getByText('Surge Technologies')).toBeDefined()
  })
})

describe('the revenue and ebitda chart', () => {
  const timeseries: FundQuarterPoint[] = [
    {
      quarter: '2024-Q2',
      revenue: 102_000_000,
      ebitda: -4_000_000,
      headcount: 400,
      reporting: ['a', 'b', 'c', 'd', 'e'],
      reportingCompanies: 5,
      totalCompanies: 5,
    },
    {
      quarter: '2024-Q3',
      revenue: null,
      ebitda: null,
      headcount: null,
      reporting: [],
      reportingCompanies: 0,
      totalCompanies: 5,
    },
  ]

  it('describes the trend for a reader who cannot see the lines', () => {
    render(<KpiChart timeseries={timeseries} />)

    expect(screen.getByRole('img', { name: /Revenue and EBITDA by quarter/ })).toBeDefined()
    expect(screen.getByRole('img', { name: /No revenue was reported in 2024-Q3/ })).toBeDefined()
  })

  it('carries the figures in a real table, not only in the drawing', () => {
    render(<KpiChart timeseries={timeseries} />)

    expect(screen.getByRole('table', { name: /in figures/ })).toBeDefined()
    expect(screen.getByRole('rowheader', { name: '2024-Q2' })).toBeDefined()
    expect(screen.getByText('$102.0M')).toBeDefined()
  })

  it('leaves an unreported quarter blank rather than drawing it as zero', () => {
    render(<KpiChart timeseries={timeseries} />)

    expect(screen.queryByText('$0.0M')).toBeNull()
    expect(screen.getAllByText('—').length).toBe(2)
  })
})
