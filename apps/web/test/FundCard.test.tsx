import FundCard from '@/app/FundCard'
import type { FundListing } from '@/lib/portfolio'
import { cleanup, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'

const fund: FundListing = {
  id: 'fund-003',
  name: 'Acme Growth Fund III',
  strategy: 'private_credit',
  vintageYear: 2020,
  status: 'investing',
  targetSizeUsd: 447_000_000,
  companyCount: 5,
  latestQuarter: '2025-Q4',
  latestRevenue: 603_649_894,
  revenueGrowthYoy: 0.4178,
  ebitdaMargin: 0.0464,
  portfolioValuation: { value: 4_724_601_469, asOf: '2025-Q4' },
  companies: [
    { id: 'co-008', name: 'Cobalt Logistics' },
    { id: 'co-009', name: 'Northgate Foods' },
  ],
  timeseries: [
    {
      quarter: '2025-Q3',
      revenue: null,
      ebitda: null,
      headcount: null,
      reportingCompanies: 0,
      totalCompanies: 5,
    },
    {
      quarter: '2025-Q4',
      revenue: 603_649_894,
      ebitda: 28_000_000,
      headcount: 9000,
      reportingCompanies: 4,
      totalCompanies: 5,
    },
  ],
}

const renderCard = (listing: FundListing) =>
  render(
    <ul>
      <FundCard fund={listing} />
    </ul>,
  )

afterEach(cleanup)

describe('a fund card', () => {
  it('names the fund in a heading that drills into it', () => {
    renderCard(fund)

    expect(screen.getByRole('heading', { level: 2, name: 'Acme Growth Fund III' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Acme Growth Fund III' }).getAttribute('href')).toBe(
      '/funds/fund-003',
    )
  })

  it('lists the companies belonging to the fund, so browsing does not require a drill-down', () => {
    renderCard(fund)

    expect(screen.getByText('Cobalt Logistics')).toBeDefined()
    expect(screen.getByText('Northgate Foods')).toBeDefined()
  })

  it('says the direction of growth in words, not only with a glyph and a colour', () => {
    renderCard(fund)

    expect(screen.getByText('increased by')).toBeDefined()
    expect(screen.getByText(/\+41\.8% year on year/)).toBeDefined()
  })

  it('warns in prose when the headline figure rests on fewer companies than the fund holds', () => {
    renderCard(fund)

    expect(screen.getByText('4 of 5 companies reported in 2025-Q4')).toBeDefined()
  })

  it('stays quiet when every company reported, rather than badging a non-problem', () => {
    const complete = {
      ...fund,
      timeseries: fund.timeseries.map((point) => ({ ...point, reportingCompanies: 5 })),
    }

    renderCard(complete)

    expect(screen.queryByText(/companies reported in/)).toBeNull()
  })

  it('describes the quarter the headline figure came from, not the last one on the grid', () => {
    renderCard({ ...fund, latestQuarter: '2025-Q3' })

    expect(screen.getByText('0 of 5 companies reported in 2025-Q3')).toBeDefined()
  })

  it('shows an em dash instead of a zero for a fund that was never valued', () => {
    renderCard({ ...fund, portfolioValuation: null, ebitdaMargin: null })

    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('has no accessibility violations axe can find', async () => {
    const { container } = renderCard(fund)
    const { violations } = await axe.run(container)

    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})
