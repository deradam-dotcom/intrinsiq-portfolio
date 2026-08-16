import { GET as fundsRoute } from '@/app/api/funds/route'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { feeds, stubUpstream } from './feeds'

const upstreamHost = 'private-alpha.github.io'

let logged: unknown[][]

beforeEach(() => {
  logged = []
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    logged.push(args)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const failWith = async (answer: Parameters<typeof stubUpstream>[0]) => {
  stubUpstream(answer)

  const response = await fundsRoute()

  return { status: response.status, body: await response.text() }
}

describe('an upstream that misbehaves', () => {
  it('becomes a 502 when it answers with a server error', async () => {
    const { status, body } = await failWith((feed) =>
      feed === 'kpis'
        ? new Response('upstream exploded', { status: 500 })
        : Response.json(feeds[feed]),
    )

    expect(status).toBe(502)
    expect(JSON.parse(body)).toEqual({
      error: {
        code: 'upstream_unavailable',
        message: 'The portfolio data source could not be read.',
      },
    })
  })

  it('becomes a 502 when it breaks its own schema, rather than crashing downstream', async () => {
    const { status, body } = await failWith((feed) =>
      feed === 'kpis'
        ? Response.json([{ ...feeds.kpis[0], revenue: '1000000' }])
        : Response.json(feeds[feed]),
    )

    expect(status).toBe(502)
    expect(JSON.parse(body).error.code).toBe('upstream_unavailable')
  })

  it('becomes a 502 when it accepts the connection and then goes quiet', async () => {
    stubUpstream(() => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    })

    expect((await fundsRoute()).status).toBe(502)
  })
})

describe('what an error is allowed to say', () => {
  it('tells the client nothing about the upstream it could not read', async () => {
    const { body } = await failWith((feed) =>
      feed === 'funds' ? new Response('', { status: 503 }) : Response.json(feeds[feed]),
    )

    expect(body).not.toContain(upstreamHost)
    expect(body).not.toContain('503')
    expect(body).not.toContain('at ')
  })

  it('writes the detail the client is denied to the server log instead of dropping it', async () => {
    await failWith((feed) =>
      feed === 'funds' ? new Response('', { status: 503 }) : Response.json(feeds[feed]),
    )

    expect(logged).toHaveLength(1)
    expect(String(logged[0])).toContain(upstreamHost)
    expect(String(logged[0])).toContain('503')
  })
})

describe('the deadline on every upstream call', () => {
  it('is armed, so a hanging vendor cannot hold the handler open', async () => {
    const fetchMock = stubUpstream()

    await fundsRoute()

    expect(fetchMock).toHaveBeenCalledTimes(3)

    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
  })
})
