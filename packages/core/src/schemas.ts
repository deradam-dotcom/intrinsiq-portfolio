import { z } from 'zod'

const fundStrategySchema = z.enum(['private_equity', 'venture_capital', 'private_credit'])

const fundStatusSchema = z.enum(['investing', 'post_investment'])

const quarterSchema = z.string().regex(/^\d{4}-Q[1-4]$/)

const upstreamFundSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  strategy: fundStrategySchema,
  vintageYear: z.number().int(),
  status: fundStatusSchema,
  targetSizeMillionsUsd: z.number().nonnegative(),
})

const upstreamCompanySchema = z.object({
  id: z.string().min(1),
  fundId: z.string().min(1),
  name: z.string().min(1),
  sector: z.string().min(1),
  country: z.string().min(1),
  initialInvestmentYear: z.number().int(),
})

const upstreamKpiSchema = z.object({
  companyId: z.string().min(1),
  quarter: quarterSchema,
  revenue: z.number().nonnegative().nullable(),
  ebitda: z.number().nullable(),
  headcount: z.number().int().nonnegative().nullable(),
  valuation: z.number().nonnegative().nullable(),
})

export const upstreamFundsSchema = z.array(upstreamFundSchema)

export const upstreamCompaniesSchema = z.array(upstreamCompanySchema)

export const upstreamKpisSchema = z.array(upstreamKpiSchema)

export type FundStrategy = z.infer<typeof fundStrategySchema>

export type FundStatus = z.infer<typeof fundStatusSchema>

export type UpstreamFund = z.infer<typeof upstreamFundSchema>

export type UpstreamCompany = z.infer<typeof upstreamCompanySchema>

export type UpstreamKpi = z.infer<typeof upstreamKpiSchema>
