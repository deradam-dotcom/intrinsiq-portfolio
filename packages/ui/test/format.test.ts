import { describe, expect, it } from 'vitest'
import { formatMillions, formatPercent, formatSignedPercent, notReported } from '#lib/format'

describe('formatting a figure the domain keeps in absolute USD', () => {
  it('reads it back in millions, which is how a manager talks about it', () => {
    expect(formatMillions(102_006_368)).toBe('$102.0M')
    expect(formatMillions(352_000_000)).toBe('$352.0M')
  })

  it('shows an em dash rather than a zero when nothing was reported', () => {
    expect(formatMillions(null)).toBe(notReported)
    expect(formatPercent(null)).toBe(notReported)
    expect(formatSignedPercent(null)).toBe(notReported)
  })
})

describe('formatting a rate', () => {
  it('always signs a growth rate, because the direction is the point', () => {
    expect(formatSignedPercent(0.4178)).toBe('+41.8%')
    expect(formatSignedPercent(-0.357)).toBe('-35.7%')
  })

  it('leaves a margin unsigned, and keeps a loss negative', () => {
    expect(formatPercent(0.1882)).toBe('18.8%')
    expect(formatPercent(-0.2196)).toBe('-22.0%')
  })
})
