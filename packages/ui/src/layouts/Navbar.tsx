import type { ReactNode } from 'react'
import styles from './Navbar.module.css'

type NavbarProps = {
  brand: ReactNode
}

const Navbar = ({ brand }: NavbarProps) => (
  <header className={styles.bar}>
    <div className={styles.inner}>
      <span className={styles.brand}>{brand}</span>
    </div>
  </header>
)

export default Navbar
