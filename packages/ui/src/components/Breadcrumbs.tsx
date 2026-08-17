import type { ReactNode } from 'react'
import styles from './Breadcrumbs.module.css'

type BreadcrumbsProps = {
  items: readonly ReactNode[]
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className={styles.nav}>
    <ol>
      {items.map((item, index) => (
        <li aria-current={index === items.length - 1 ? 'page' : undefined} key={index}>
          {item}
        </li>
      ))}
    </ol>
  </nav>
)

export default Breadcrumbs
