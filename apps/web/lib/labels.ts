import type { FundStatus, FundStrategy } from '@intrinsiq/core'

export const strategyLabels: Record<FundStrategy, string> = {
  private_equity: 'Private equity',
  venture_capital: 'Venture capital',
  private_credit: 'Private credit',
}

export const statusLabels: Record<FundStatus, string> = {
  investing: 'Investing',
  post_investment: 'Post-investment',
}

const choices = (labels: Record<string, string>, all: string) => [
  { value: 'all', label: all },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
]

export const strategyOptions = choices(strategyLabels, 'All strategies')

export const statusOptions = choices(statusLabels, 'All statuses')
