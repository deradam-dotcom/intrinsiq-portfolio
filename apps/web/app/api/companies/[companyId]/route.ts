import { notFound, ok, upstreamUnavailable } from '@/lib/api'
import { loadPortfolio } from '@/lib/upstream'

export const GET = async (
  _request: Request,
  { params }: RouteContext<'/api/companies/[companyId]'>,
): Promise<Response> => {
  const { companyId } = await params

  try {
    const portfolio = await loadPortfolio()
    const company = portfolio.funds
      .flatMap((fund) => fund.companies)
      .find((candidate) => candidate.summary.id === companyId)

    if (company === undefined) {
      return notFound('No portfolio company is held under that id.')
    }

    return ok({ company: company.summary, series: company.series })
  } catch (cause) {
    return upstreamUnavailable(cause)
  }
}
