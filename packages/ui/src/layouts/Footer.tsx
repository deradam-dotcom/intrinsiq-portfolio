import styles from './Footer.module.css'

const Footer = () => (
  <footer className={styles.footer}>
    <p>INTRINSIQ © {new Date().getFullYear()}</p>
  </footer>
)

export default Footer
