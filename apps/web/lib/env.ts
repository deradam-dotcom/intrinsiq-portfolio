import 'server-only'
import { z } from 'zod'

const seedData = 'https://private-alpha.github.io/takehome-seed-data/api'

const envSchema = z.object({
  UPSTREAM_FUNDS_URL: z.url().default(`${seedData}/funds.json`),
  UPSTREAM_COMPANIES_URL: z.url().default(`${seedData}/companies.json`),
  UPSTREAM_KPIS_URL: z.url().default(`${seedData}/kpis.json`),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  UPSTREAM_REVALIDATE_SECONDS: z.coerce.number().int().nonnegative().default(3_600),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(`Upstream configuration is invalid.\n${z.prettifyError(parsed.error)}`)
}

export const env = parsed.data
