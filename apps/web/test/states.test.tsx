import ErrorPage from '@/app/error'
import Loading from '@/app/loading'
import NotFoundPage from '@/app/not-found'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const upstreamFailure = Object.assign(
  new Error('fetch failed: connect ECONNREFUSED 185.199.108.153:443 (private-alpha.github.io)'),
  { digest: '2947183640' },
)

afterEach(cleanup)

describe('the error state', () => {
  it('announces itself without repeating what the server said', () => {
    const { container } = render(<ErrorPage error={upstreamFailure} reset={() => {}} />)

    expect(screen.getByRole('alert')).toBeDefined()
    expect(container.textContent).not.toContain('ECONNREFUSED')
    expect(container.textContent).not.toContain('185.199.108.153')
    expect(container.textContent).not.toContain('private-alpha.github.io')
  })

  it('offers the retry that re-runs the failed render', async () => {
    const reset = vi.fn()

    render(<ErrorPage error={upstreamFailure} reset={reset} />)
    screen.getByRole('button', { name: 'Try again' }).click()

    expect(reset).toHaveBeenCalledOnce()
  })
})

describe('the not found state', () => {
  it('offers a way back rather than a dead end', () => {
    render(<NotFoundPage />)

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Back to the overview' }).getAttribute('href')).toBe(
      '/',
    )
  })
})

describe('the loading state', () => {
  it('says it is busy in words, not only in moving rectangles', () => {
    const { container } = render(<Loading />)

    expect(screen.getByRole('status').textContent).toBe('Loading portfolio data.')
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })
})
