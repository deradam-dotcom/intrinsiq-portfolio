import 'server-only'
import { env } from '@/lib/env'
import { NextResponse } from 'next/server'

const cacheControl = `public, max-age=0, s-maxage=${env.UPSTREAM_REVALIDATE_SECONDS}, stale-while-revalidate=60`

export const ok = <T>(payload: T) =>
  NextResponse.json(payload, { headers: { 'Cache-Control': cacheControl } })

export const notFound = (message: string) =>
  NextResponse.json({ error: { code: 'not_found', message } }, { status: 404 })

export const upstreamUnavailable = (cause: unknown) => {
  console.error('Upstream request failed.', cause)

  return NextResponse.json(
    {
      error: {
        code: 'upstream_unavailable',
        message: 'The portfolio data source could not be read.',
      },
    },
    { status: 502 },
  )
}
