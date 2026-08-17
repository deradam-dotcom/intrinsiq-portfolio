import { describe, expect, it } from 'vitest'
import { cn } from '#lib/cn'

describe('cn', () => {
  it('joins the classes that survived their condition', () => {
    expect(cn('card', 'raised')).toBe('card raised')
    expect(cn('card', false && 'raised')).toBe('card')
  })

  it('drops the gaps rather than leaving them in the attribute', () => {
    expect(cn('card', undefined, null, '', 'raised')).toBe('card raised')
  })

  it('returns an empty string when nothing applies, never the word undefined', () => {
    expect(cn(false && 'a', null)).toBe('')
  })
})
