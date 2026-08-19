import Link from 'next/link'

const NotFoundPage = () => (
  <div className="state-panel">
    <h1>Not in this portfolio</h1>
    <p>
      No fund or company is held under that address. A company also answers this way when it is real
      but belongs to a different fund than the one in the URL.
    </p>
    <Link href="/">Back to the overview</Link>
  </div>
)

export default NotFoundPage
