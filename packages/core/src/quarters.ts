const quarterPattern = /^(\d{4})-Q([1-4])$/

export const quartersPerYear = 4

export const toQuarterIndex = (quarter: string): number | null => {
  const match = quarterPattern.exec(quarter)

  if (match?.[1] === undefined || match[2] === undefined) {
    return null
  }

  return Number(match[1]) * quartersPerYear + (Number(match[2]) - 1)
}

export const fromQuarterIndex = (index: number): string =>
  `${Math.floor(index / quartersPerYear)}-Q${(index % quartersPerYear) + 1}`

export const shiftQuarter = (quarter: string, offset: number): string | null => {
  const index = toQuarterIndex(quarter)

  return index === null ? null : fromQuarterIndex(index + offset)
}

export const buildQuarterGrid = (quarters: readonly string[]): string[] => {
  const indices = quarters.map(toQuarterIndex).filter((index) => index !== null)

  if (indices.length === 0) {
    return []
  }

  const first = Math.min(...indices)
  const last = Math.max(...indices)

  return Array.from({ length: last - first + 1 }, (_, offset) => fromQuarterIndex(first + offset))
}
