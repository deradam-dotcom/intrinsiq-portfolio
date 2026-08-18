import ValuationEvents from '@/app/funds/[fundId]/companies/[companyId]/_components/ValuationEvents'
import type { CompanyQuarterPoint } from '@intrinsiq/core'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

const point = (quarter: string, valuation: number | null): CompanyQuarterPoint => ({
  quarter,
  revenue: 1,
  ebitda: 1,
  headcount: 1,
  valuation,
})

afterEach(cleanup)

describe('the valuation events list', () => {
  it('shows only the quarters a valuation actually happened in', () => {
    render(
      <ValuationEvents
        series={[point('2024-Q1', 90_000_000), point('2024-Q2', null), point('2024-Q3', null)]}
      />,
    )

    expect(screen.getByText('2024-Q1')).toBeDefined()
    expect(screen.queryByText('2024-Q2')).toBeNull()
    expect(screen.getByText('$90.0M')).toBeDefined()
  })

  it('says so in a sentence when a company has never been valued', () => {
    render(<ValuationEvents series={[point('2024-Q1', null)]} />)

    expect(screen.getByText('This company has never been valued.')).toBeDefined()
  })
})
