export type SparklinePoint = {
  x: number
  y: number
}

export const toSparklineRuns = (
  values: readonly (number | null)[],
  width: number,
  height: number,
): SparklinePoint[][] => {
  const reported = values.filter((value) => value !== null)

  if (reported.length === 0) {
    return []
  }

  const lowest = Math.min(...reported)
  const span = Math.max(...reported) - lowest
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const runs: SparklinePoint[][] = []

  values.forEach((value, index) => {
    if (value === null) {
      return
    }

    const point = {
      x: index * stepX,
      y: span === 0 ? height / 2 : height - ((value - lowest) / span) * height,
    }

    const continuing = index > 0 && values[index - 1] !== null ? runs.at(-1) : undefined

    if (continuing === undefined) {
      runs.push([point])
    } else {
      continuing.push(point)
    }
  })

  return runs
}
