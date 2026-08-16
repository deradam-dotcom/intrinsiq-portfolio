import type { ReactNode } from 'react'
import styles from './AppShell.module.css'

type AppShellProps = {
  brand: ReactNode
  children: ReactNode
}

const AppShell = ({ brand, children }: AppShellProps) => (
  <>
    <a className={styles.skipLink} href="#main">
      Skip to main content
    </a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <span className={styles.brand}>{brand}</span>
      </div>
    </header>
    <main className={styles.main} id="main">
      {children}
    </main>
  </>
)

export default AppShell
