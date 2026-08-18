import type { FundQuarterPoint } from '@intrinsiq/core'
import { formatMillions } from '@intrinsiq/ui/format'

export const describeSeries = (timeseries: readonly FundQuarterPoint[]) => {
  const reported = timeseries.filter((point) => point.revenue !== null)
  const first = reported[0]
  const last = reported.at(-1)

  if (first === undefined || last === undefined) {
    return 'Revenue and EBITDA by quarter. No quarter has been reported for this fund.'
  }

  const silent = timeseries
    .filter((point) => point.revenue === null)
    .map((point) => point.quarter)
    .join(', ')

  const trend = `Revenue and EBITDA by quarter from ${first.quarter} to ${last.quarter}, revenue moving from ${formatMillions(first.revenue)} to ${formatMillions(last.revenue)}.`

  return silent === '' ? trend : `${trend} No revenue was reported in ${silent}.`
}
