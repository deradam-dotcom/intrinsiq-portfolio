import { normalizeKpiFeed } from '#normalize'
import type { UpstreamKpi } from '#schemas'
import { describe, expect, it } from 'vitest'
import { companyIds, kpis } from './feeds'

const feed = normalizeKpiFeed(kpis, companyIds)

const rowFor = (companyId: string, quarter: string) =>
  feed.rows.find((row) => row.companyId === companyId && row.quarter === quarter)

const quartersFor = (companyId: string) =>
  feed.rows.filter((row) => row.companyId === companyId).map((row) => row.quarter)

const keyOf = (row: UpstreamKpi) => `${row.companyId}:${row.quarter}`

describe('normalizeKpiFeed', () => {
  it('resolves a conflicting duplicate to the row that appears last in the feed', () => {
    expect(rowFor('co-014', '2023-Q2')?.revenue).toBe(71_180_859)
    expect(rowFor('co-023', '2025-Q1')?.revenue).toBe(54_877_703)
  })

  it('resolves duplicates by position even when that lowers the reported figure', () => {
    const [restatedUp, restatedDown] = [rowFor('co-014', '2023-Q2'), rowFor('co-023', '2025-Q1')]

    expect(restatedUp?.revenue).toBeGreaterThan(64_709_872)
    expect(restatedDown?.revenue).toBeLessThan(60_975_225)
  })

  it('leaves exactly one row per company and quarter', () => {
    const keys = feed.rows.map(keyOf)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('keeps a corrected row in its chronological position instead of at the end', () => {
    expect(quartersFor('co-014').slice(0, 3)).toEqual(['2023-Q1', '2023-Q2', '2023-Q3'])
  })

  it('drops kpi rows belonging to companies that do not exist', () => {
    const survivors = feed.rows.map((row) => row.companyId)

    expect(survivors).not.toContain('co-999')
    expect(survivors).not.toContain('co-998')
  })

  it('reports how many rows it discarded and merged', () => {
    expect(feed.orphanKpiRows).toBe(2)
    expect(feed.duplicatesResolved).toBe(2)
    expect(feed.rows).toHaveLength(kpis.length - feed.orphanKpiRows - feed.duplicatesResolved)
  })

  it('leaves reported nulls alone rather than filling them in', () => {
    const nulls = feed.rows.filter((row) => row.revenue === null)

    expect(nulls.length).toBeGreaterThan(0)
    expect(feed.rows.some((row) => row.revenue === 0)).toBe(false)
  })
})
