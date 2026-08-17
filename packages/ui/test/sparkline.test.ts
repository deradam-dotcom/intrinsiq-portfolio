import { describe, expect, it } from 'vitest'
import { toSparklineRuns } from '../src/sparkline'

describe('toSparklineRuns', () => {
  it('spreads the reported quarters across the full width and inverts the y axis', () => {
    expect(toSparklineRuns([10, 20, 30], 100, 40)).toEqual([
      [
        { x: 0, y: 40 },
        { x: 50, y: 20 },
        { x: 100, y: 0 },
      ],
    ])
  })

  it('breaks the line at a gap instead of drawing through it', () => {
    const runs = toSparklineRuns([10, null, 30, 40], 90, 30)

    expect(runs).toHaveLength(2)
    expect(runs[0]).toHaveLength(1)
    expect(runs[1]?.map((point) => point.x)).toEqual([60, 90])
  })

  it('keeps a lone reported quarter as its own run so it can still be drawn', () => {
    expect(toSparklineRuns([null, 5, null], 100, 20)).toEqual([[{ x: 50, y: 10 }]])
  })

  it('centres a flat series rather than dividing by a zero range', () => {
    expect(toSparklineRuns([7, 7], 100, 20)).toEqual([
      [
        { x: 0, y: 10 },
        { x: 100, y: 10 },
      ],
    ])
  })

  it('draws nothing when no quarter reported', () => {
    expect(toSparklineRuns([null, null], 100, 20)).toEqual([])
  })
})
