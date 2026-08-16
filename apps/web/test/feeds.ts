import { vi } from 'vitest'

export const feeds = {
  funds: [
    {
      id: 'fund-001',
      name: 'Northwind Fund II',
      strategy: 'private_equity',
      vintageYear: 2019,
      status: 'investing',
      targetSizeMillionsUsd: 352,
    },
    {
      id: 'fund-002',
      name: 'Zenith Partners Fund I',
      strategy: 'venture_capital',
      vintageYear: 2021,
      status: 'post_investment',
      targetSizeMillionsUsd: 120,
    },
  ],
  companies: [
    {
      id: 'co-001',
      fundId: 'fund-001',
      name: 'Halcyon Robotics',
      sector: 'software',
      country: 'US',
      initialInvestmentYear: 2019,
    },
    {
      id: 'co-002',
      fundId: 'fund-001',
      name: 'Meridian Health',
      sector: 'healthcare',
      country: 'DE',
      initialInvestmentYear: 2020,
    },
    {
      id: 'co-003',
      fundId: 'fund-002',
      name: 'Surge Technologies',
      sector: 'logistics',
      country: 'GB',
      initialInvestmentYear: 2022,
    },
  ],
  kpis: [
    {
      companyId: 'co-001',
      quarter: '2024-Q1',
      revenue: 1_000_000,
      ebitda: 200_000,
      headcount: 10,
      valuation: 5_000_000,
    },
    {
      companyId: 'co-001',
      quarter: '2024-Q2',
      revenue: 1_200_000,
      ebitda: 300_000,
      headcount: 12,
      valuation: null,
    },
    {
      companyId: 'co-002',
      quarter: '2024-Q2',
      revenue: 800_000,
      ebitda: null,
      headcount: 20,
      valuation: null,
    },
    {
      companyId: 'co-999',
      quarter: '2024-Q2',
      revenue: 999_000,
      ebitda: null,
      headcount: null,
      valuation: null,
    },
  ],
}

type FeedName = keyof typeof feeds

const feedNameOf = (url: string): FeedName => {
  const name = url.split('/').at(-1)?.replace('.json', '')

  if (name !== 'funds' && name !== 'companies' && name !== 'kpis') {
    throw new Error(`The app reached for an upstream file it should not know about: ${url}`)
  }

  return name
}

export const stubUpstream = (
  answer: (feed: FeedName) => Response = (feed) => Response.json(feeds[feed]),
) => {
  const fetchMock = vi.fn((...call: [url: string, init?: RequestInit]) =>
    Promise.resolve(answer(feedNameOf(call[0]))),
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}
