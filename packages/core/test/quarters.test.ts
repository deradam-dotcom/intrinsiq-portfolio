import { buildQuarterGrid, shiftQuarter, toQuarterIndex } from '#quarters'
import { describe, expect, it } from 'vitest'
import { kpis } from './feeds'

describe('buildQuarterGrid', () => {
  it('spans the full reporting window found in the feed', () => {
    const grid = buildQuarterGrid(kpis.map((row) => row.quarter))

    expect(grid).toHaveLength(12)
    expect(grid.at(0)).toBe('2023-Q1')
    expect(grid.at(-1)).toBe('2025-Q4')
  })

  it('fills quarters nobody reported so every series lines up', () => {
    expect(buildQuarterGrid(['2024-Q3', '2023-Q4'])).toEqual([
      '2023-Q4',
      '2024-Q1',
      '2024-Q2',
      '2024-Q3',
    ])
  })

  it('has nothing to lay out when no quarter is readable', () => {
    expect(buildQuarterGrid([])).toEqual([])
    expect(buildQuarterGrid(['last thursday'])).toEqual([])
  })
})

describe('shiftQuarter', () => {
  it('crosses year boundaries in both directions', () => {
    expect(shiftQuarter('2024-Q1', -4)).toBe('2023-Q1')
    expect(shiftQuarter('2023-Q4', 1)).toBe('2024-Q1')
    expect(shiftQuarter('2025-Q2', -5)).toBe('2024-Q1')
  })

  it('refuses a quarter it cannot parse instead of guessing', () => {
    expect(shiftQuarter('2024-Q5', -4)).toBeNull()
    expect(toQuarterIndex('2024Q1')).toBeNull()
  })
})
