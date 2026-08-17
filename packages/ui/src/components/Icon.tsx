type IconName =
  | 'funds'
  | 'companies'
  | 'revenue'
  | 'gap'
  | 'margin'
  | 'valuation'
  | 'target'
  | 'chevron'
  | 'check'

type IconProps = {
  name: IconName
}

const paths: Record<IconName, string[]> = {
  funds: ['M12 3 21 7.5 12 12 3 7.5Z', 'M3 12.5 12 17l9-4.5', 'M3 16.5 12 21l9-4.5'],
  companies: [
    'M3 21h18',
    'M6 21V5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v16',
    'M13 21v-9h4a1 1 0 0 1 1 1v8',
    'M9 8h1M9 12h1M9 16h1',
  ],
  revenue: ['M3 17l6-6 4 4 8-8', 'M17 7h4v4'],
  gap: ['M12 4 2.5 20h19z', 'M12 10v4', 'M12 17h.01'],
  margin: [
    'M19 5 5 19',
    'M4 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    'M15 17.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  ],
  valuation: ['M12 3 21 9l-9 12L3 9Z', 'M3 9h18', 'M12 3 9 9l3 12', 'M12 3l3 6-3 12'],
  target: [
    'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
    'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0',
    'M12 12h.01',
  ],
  chevron: ['m6 9 6 6 6-6'],
  check: ['m4 12 5 5 11-11'],
}

const Icon = ({ name }: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.6"
    viewBox="0 0 24 24"
  >
    {paths[name].map((path) => (
      <path d={path} key={path} />
    ))}
  </svg>
)

export default Icon
