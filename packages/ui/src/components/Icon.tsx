type IconName = 'funds' | 'companies' | 'revenue' | 'gap'

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
