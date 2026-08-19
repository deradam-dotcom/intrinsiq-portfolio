import styles from './LoadingSkeleton.module.css'

const tiles = [0, 1, 2, 3]
const cards = [0, 1, 2]

const LoadingSkeleton = () => (
  <div aria-busy="true">
    <p className={styles.status} role="status">
      Loading portfolio data.
    </p>
    <div aria-hidden="true">
      <div className={styles.title} />
      <div className={styles.lead} />
      <div className={styles.summary}>
        {tiles.map((tile) => (
          <div className={styles.tile} key={tile}>
            <div className={styles.label} />
            <div className={styles.figure} />
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div className={styles.card} key={card} />
        ))}
      </div>
    </div>
  </div>
)

export default LoadingSkeleton
