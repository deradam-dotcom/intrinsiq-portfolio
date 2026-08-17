import { GET as companyRoute } from '@/app/api/companies/[companyId]/route'
import { GET as fundRoute } from '@/app/api/funds/[fundId]/route'
import { GET as fundsRoute } from '@/app/api/funds/route'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubUpstream } from './feeds'

const request = new Request('http://localhost/api')

const overview = async () => (await fundsRoute()).json()

const fundDetail = (fundId: string) => fundRoute(request, { params: Promise.resolve({ fundId }) })

const companyDetail = (companyId: string) =>
  companyRoute(request, { params: Promise.resolve({ companyId }) })

beforeEach(() => {
  stubUpstream()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the fund overview endpoint', () => {
  it('answers with a summary, a company roster and a fund-level series per fund', async () => {
    const { funds } = await overview()

    expect(funds.map((fund: { id: string }) => fund.id)).toEqual(['fund-001', 'fund-002'])
    expect(Object.keys(funds[0])).toEqual([
      'id',
      'name',
      'strategy',
      'vintageYear',
      'status',
      'targetSizeUsd',
      'companyCount',
      'latestQuarter',
      'latestRevenue',
      'revenueGrowthYoy',
      'ebitdaMargin',
      'portfolioValuation',
      'companies',
      'timeseries',
    ])
  })

  it('names the companies in each fund without shipping their quarterly rows', async () => {
    const { funds } = await overview()

    expect(funds[0].companies).toEqual([
      { id: 'co-001', name: 'Halcyon Robotics', latestQuarter: '2024-Q2' },
      { id: 'co-002', name: 'Meridian Health', latestQuarter: '2024-Q2' },
    ])
  })

  it('converts the million-dollar unit before the figure leaves the API', async () => {
    const { funds } = await overview()

    expect(funds[0].targetSizeUsd).toBe(352_000_000)
  })

  it('reports what the pipeline had to repair instead of discarding it quietly', async () => {
    const { dataQuality } = await overview()

    expect(dataQuality).toEqual({
      duplicatesResolved: 0,
      orphanKpiRows: 1,
      companiesWithoutKpis: 1,
    })
  })

  it('says which company never reported, rather than only how many', async () => {
    const { funds } = await overview()

    expect(funds[1].companies).toEqual([
      { id: 'co-003', name: 'Surge Technologies', latestQuarter: null },
    ])
  })

  it('states its cache intent rather than inheriting a default', async () => {
    const response = await fundsRoute()

    expect(response.headers.get('Cache-Control')).toContain('s-maxage=3600')
  })
})

describe('the fund detail endpoint', () => {
  it('hands out the companies and the quarterly series the overview withholds', async () => {
    const payload = await (await fundDetail('fund-001')).json()

    expect(Object.keys(payload)).toEqual(['fund', 'companies', 'timeseries'])
    expect(payload.companies.map((company: { id: string }) => company.id)).toEqual([
      'co-001',
      'co-002',
    ])
  })

  it('carries the coverage count next to the total it belongs to', async () => {
    const { timeseries } = await (await fundDetail('fund-001')).json()

    expect(timeseries).toEqual([
      {
        quarter: '2024-Q1',
        revenue: 1_000_000,
        ebitda: 200_000,
        headcount: 10,
        reportingCompanies: 1,
        totalCompanies: 2,
      },
      {
        quarter: '2024-Q2',
        revenue: 2_000_000,
        ebitda: 300_000,
        headcount: 32,
        reportingCompanies: 2,
        totalCompanies: 2,
      },
    ])
  })

  it('renders a fund whose only company never reported, rather than failing', async () => {
    const { fund, timeseries } = await (await fundDetail('fund-002')).json()

    expect(fund.latestQuarter).toBeNull()
    expect(fund.companyCount).toBe(1)
    expect(timeseries.every((point: { revenue: null }) => point.revenue === null)).toBe(true)
    expect(
      timeseries.map((point: { reportingCompanies: number }) => point.reportingCompanies),
    ).toEqual([0, 0])
  })

  it('answers 404 for an id no fund is held under', async () => {
    const response = await fundDetail('fund-404')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: { code: 'not_found', message: 'No fund is held under that id.' },
    })
  })
})

describe('the company detail endpoint', () => {
  it('keeps a valuation where it was reported instead of carrying it across the series', async () => {
    const { company, series } = await (await companyDetail('co-001')).json()

    expect(company.valuation).toEqual({ value: 5_000_000, asOf: '2024-Q1' })
    expect(series.map((point: { valuation: number | null }) => point.valuation)).toEqual([
      5_000_000,
      null,
    ])
  })

  it('is reachable even though the company belongs to a fund the url never names', async () => {
    const { company } = await (await companyDetail('co-003')).json()

    expect(company.fundId).toBe('fund-002')
    expect(company.missingQuarters).toEqual(['2024-Q1', '2024-Q2'])
  })

  it('answers 404 for an orphan row that never became a company', async () => {
    expect((await companyDetail('co-999')).status).toBe(404)
  })
})
