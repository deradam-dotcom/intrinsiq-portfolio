import 'server-only'
import type { DataQualityReport, FundQuarterPoint, FundSummary } from '@intrinsiq/core'
import { headers } from 'next/headers'

export type FundListing = FundSummary & {
  companies: { id: string; name: string; latestQuarter: string | null }[]
  timeseries: FundQuarterPoint[]
}

export type FundsResponse = {
  funds: FundListing[]
  dataQuality: DataQualityReport
}

const toAbsolute = async (path: string) => {
  const incoming = await headers()
  const host = incoming.get('host') ?? 'localhost:3000'
  const protocol = incoming.get('x-forwarded-proto') ?? 'http'

  return `${protocol}://${host}${path}`
}

export const getFunds = async (): Promise<FundsResponse> => {
  const response = await fetch(await toAbsolute('/api/funds'))

  if (!response.ok) {
    throw new Error(`The portfolio API answered ${response.status}.`)
  }

  return response.json()
}
