'use client'

import { statusOptions, strategyOptions } from '@/lib/labels'
import Select from '@intrinsiq/ui/primitives/Select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import styles from './FundFilters.module.css'

const sortOptions = [
  { value: 'revenue', label: 'Latest revenue' },
  { value: 'growth', label: 'Revenue growth' },
  { value: 'size', label: 'Target size' },
  { value: 'name', label: 'Name' },
] as const

type FundFiltersProps = {
  strategy: string
  status: string
  sort: string
  shown: number
  total: number
}

const FundFilters = ({ strategy, status, sort, shown, total }: FundFiltersProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const apply = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)

    if (value === 'all' || (key === 'sort' && value === 'revenue')) {
      next.delete(key)
    } else {
      next.set(key, value)
    }

    const query = next.toString()

    router.replace(query === '' ? pathname : `${pathname}?${query}`, { scroll: false })
  }

  return (
    <div className={styles.bar}>
      <Select
        label="Strategy"
        onValueChange={(value) => apply('strategy', value)}
        options={strategyOptions}
        value={strategy}
      />
      <Select
        label="Status"
        onValueChange={(value) => apply('status', value)}
        options={statusOptions}
        value={status}
      />
      <Select
        label="Sort by"
        onValueChange={(value) => apply('sort', value)}
        options={sortOptions}
        value={sort}
      />
      <p aria-live="polite" className={styles.count}>
        {shown === total ? `${total} funds` : `${shown} of ${total} funds shown`}
      </p>
    </div>
  )
}

export default FundFilters
