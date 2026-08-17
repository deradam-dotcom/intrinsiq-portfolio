import type { ReactNode } from 'react'
import Footer from '#layouts/Footer'
import Navbar from '#layouts/Navbar'
import styles from './App.module.css'

type AppProps = {
  brand: ReactNode
  children: ReactNode
}

const App = ({ brand, children }: AppProps) => (
  <div className={styles.shell}>
    <a className={styles.skipLink} href="#main">
      Skip to main content
    </a>
    <Navbar brand={brand} />
    <main className={styles.main} id="main">
      {children}
    </main>
    <Footer />
  </div>
)

export default App
