import { notFound, ok, upstreamUnavailable } from '@/lib/api'
import { loadPortfolio } from '@/lib/upstream'

export const GET = async (
  _request: Request,
  { params }: RouteContext<'/api/funds/[fundId]'>,
): Promise<Response> => {
  const { fundId } = await params

  try {
    const portfolio = await loadPortfolio()
    const fund = portfolio.funds.find((candidate) => candidate.summary.id === fundId)

    if (fund === undefined) {
      return notFound('No fund is held under that id.')
    }

    return ok({
      fund: fund.summary,
      companies: fund.companies.map((company) => company.summary),
      timeseries: fund.timeseries,
    })
  } catch (cause) {
    return upstreamUnavailable(cause)
  }
}
