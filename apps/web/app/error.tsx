'use client'

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => (
  <div className="state-panel" role="alert">
    <h1>The portfolio could not be read</h1>
    <p>
      The data source did not answer as expected. Nothing is stored here, so nothing was lost — the
      figures are read fresh on every request and trying again is safe.
    </p>
    <button onClick={reset} type="button">
      Try again
    </button>
    {error.digest === undefined ? null : (
      <p className="reference">Server reference {error.digest}</p>
    )}
  </div>
)

export default ErrorPage
