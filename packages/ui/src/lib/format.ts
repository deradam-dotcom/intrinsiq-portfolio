const millionsUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const oneDecimal = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
})

const unsigned = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const whole = new Intl.NumberFormat('en-US')

export const notReported = '—'

export const formatMillions = (value: number | null) =>
  value === null ? notReported : `${millionsUsd.format(value / 1_000_000)}M`

export const formatSignedPercent = (value: number | null) =>
  value === null ? notReported : oneDecimal.format(value)

export const formatPercent = (value: number | null) =>
  value === null ? notReported : unsigned.format(value)

export const formatCount = (value: number | null) =>
  value === null ? notReported : whole.format(value)
