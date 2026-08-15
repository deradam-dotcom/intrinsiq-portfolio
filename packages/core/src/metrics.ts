export const toEbitdaMargin = (revenue: number | null, ebitda: number | null): number | null =>
  revenue === null || revenue <= 0 || ebitda === null ? null : ebitda / revenue

export const toGrowthRate = (current: number | null, base: number | null): number | null =>
  current === null || base === null || base <= 0 ? null : current / base - 1
