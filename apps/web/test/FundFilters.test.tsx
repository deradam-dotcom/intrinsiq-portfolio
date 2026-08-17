import FundFilters from '@/app/(overview)/_components/FundFilters'
import { cleanup, render, screen } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

const renderFilters = () =>
  render(<FundFilters shown={3} sort="revenue" status="all" strategy="all" total={5} />)

afterEach(cleanup)

describe('the fund filters', () => {
  it('exposes each control by its own accessible name, not by a test id', () => {
    renderFilters()

    expect(screen.getByRole('combobox', { name: 'Strategy' })).toBeDefined()
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeDefined()
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toBeDefined()
  })

  it('announces how much of the list survived the filter', () => {
    renderFilters()

    const count = screen.getByText('3 of 5 funds shown')

    expect(count.getAttribute('aria-live')).toBe('polite')
  })

  it('says the plain total when nothing is filtered out', () => {
    render(<FundFilters shown={5} sort="revenue" status="all" strategy="all" total={5} />)

    expect(screen.getByText('5 funds')).toBeDefined()
  })

  it('has no accessibility violations axe can find', async () => {
    const { container } = renderFilters()
    const { violations } = await axe.run(container)

    expect(violations.map((violation) => violation.id)).toEqual([])
  })
})
