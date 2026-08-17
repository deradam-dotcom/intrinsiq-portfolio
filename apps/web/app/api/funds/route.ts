import { ok, upstreamUnavailable } from '@/lib/api'
import { loadPortfolio } from '@/lib/upstream'

export const GET = async () => {
  try {
    const portfolio = await loadPortfolio()

    return ok({
      funds: portfolio.funds.map((fund) => ({
        ...fund.summary,
        companies: fund.companies.map((company) => ({
          id: company.summary.id,
          name: company.summary.name,
        })),
        timeseries: fund.timeseries,
      })),
      dataQuality: portfolio.dataQuality,
    })
  } catch (cause) {
    return upstreamUnavailable(cause)
  }
}
