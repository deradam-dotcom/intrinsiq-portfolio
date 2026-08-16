import 'server-only'
import { env } from '@/lib/env'
import {
  buildPortfolio,
  upstreamCompaniesSchema,
  upstreamFundsSchema,
  upstreamKpisSchema,
  type Portfolio,
} from '@intrinsiq/core'
import { cache } from 'react'
import { z, type ZodType } from 'zod'

const fetchFeed = async <T>(url: string, schema: ZodType<T>): Promise<T> => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
    next: { revalidate: env.UPSTREAM_REVALIDATE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Upstream ${url} answered ${response.status}.`)
  }

  const parsed = schema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error(
      `Upstream ${url} no longer matches its schema.\n${z.prettifyError(parsed.error)}`,
    )
  }

  return parsed.data
}

export const loadPortfolio = cache(async (): Promise<Portfolio> => {
  const [funds, companies, kpis] = await Promise.all([
    fetchFeed(env.UPSTREAM_FUNDS_URL, upstreamFundsSchema),
    fetchFeed(env.UPSTREAM_COMPANIES_URL, upstreamCompaniesSchema),
    fetchFeed(env.UPSTREAM_KPIS_URL, upstreamKpisSchema),
  ])

  return buildPortfolio(funds, companies, kpis)
})
