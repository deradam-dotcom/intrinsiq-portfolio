import type { UpstreamKpi } from '#schemas'

export type NormalizedKpiFeed = {
  rows: UpstreamKpi[]
  duplicatesResolved: number
  orphanKpiRows: number
}

const kpiKey = (row: UpstreamKpi) => `${row.companyId}:${row.quarter}`

export const normalizeKpiFeed = (
  rows: readonly UpstreamKpi[],
  knownCompanyIds: ReadonlySet<string>,
): NormalizedKpiFeed => {
  const latestByKey = new Map<string, UpstreamKpi>()
  let duplicatesResolved = 0
  let orphanKpiRows = 0

  for (const row of rows) {
    if (!knownCompanyIds.has(row.companyId)) {
      orphanKpiRows += 1
      continue
    }

    const key = kpiKey(row)
    if (latestByKey.has(key)) {
      duplicatesResolved += 1
    }

    latestByKey.set(key, row)
  }

  return {
    rows: [...latestByKey.values()],
    duplicatesResolved,
    orphanKpiRows,
  }
}
