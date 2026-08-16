# INTRINSIQ Portfolio

A dashboard for investment managers to browse funds, inspect the portfolio companies inside each fund, and read fund-level performance aggregated from the underlying companies.

The browser never talks to the upstream data source. All three feeds are fetched, validated and reshaped inside the app's own API layer, so the pages consume a stable internal contract rather than raw vendor JSON.

## Tech stack

| Layer           | Choice                          | Version        |
| --------------- | ------------------------------- | -------------- |
| Runtime         | Node.js (LTS "Krypton")         | 24.19.0        |
| Package manager | pnpm, pinned via Corepack       | 11.21.0        |
| Monorepo        | Turborepo + pnpm workspaces     | 2.10.9         |
| Framework       | Next.js (App Router)            | 16.3.0         |
| UI runtime      | React                           | 19.2.8         |
| Language        | TypeScript, `strict`            | 6.0.3          |
| Validation      | Zod, at the upstream boundary   | 4.4.3          |
| Linting         | ESLint (flat config) + Prettier | 9.39.5 / 3.9.6 |
| Tests           | Vitest                          | 4.1.10         |

Styling is plain CSS Modules. A component library is introduced only where interactive primitives justify it.

## Getting started

**Prerequisites** — Node.js 24.19.0 and Corepack. If you use `nvm`:

```bash
nvm use          # reads .nvmrc
corepack enable  # activates the pnpm version pinned in package.json
```

The root `package.json` declares `engines.node`, and `.npmrc` sets `engine-strict=true`, so `pnpm install` refuses to run on an unsupported Node version rather than failing later in a confusing way.

**Install and run:**

```bash
pnpm install
pnpm dev
```

**No `.env` file is needed.** A fresh clone runs against the real upstream, because the three feed URLs, the request timeout and the cache window all ship with working defaults. They can still be overridden — `UPSTREAM_FUNDS_URL`, `UPSTREAM_COMPANIES_URL`, `UPSTREAM_KPIS_URL`, `UPSTREAM_TIMEOUT_MS` (`5000`) and `UPSTREAM_REVALIDATE_SECONDS` (`3600`) — which is what makes it possible to point a feed at a local copy. They are validated as the config module loads, so a bad value fails immediately with the offending field named — `UPSTREAM_TIMEOUT_MS=soon` reports exactly that — instead of turning up later as `undefined` inside a fetch URL.

## Scripts

```sh
pnpm dev           # Development server on `localhost:3000`
pnpm build         # Production build across the workspace graph
pnpm start         # Serves the production build
pnpm lint          # ESLint, warnings treated as errors
pnpm typecheck     # Route type generation, then `tsc --noEmit`
pnpm test          # Vitest, once, across the workspace graph
pnpm format        # Rewrites files with Prettier
pnpm format:check  # Verifies formatting without writing
```

## Project structure

```
apps/web/               Next.js application — route handlers and pages
  app/                  App Router: layouts and pages.
  app/api/              The API layer — the only thing that calls a vendor URL,
                        and the only contract the pages are allowed to know.
  lib/env.ts            The only module that reads the environment, validated
                        once so a bad value fails loudly rather than inside a URL.
  lib/upstream.ts       The only module that touches the network: fetches the
                        three feeds, validates them, hands them to the domain.
  lib/api.ts            The response shapes every handler shares — cache header,
                        404, and the sanitised 502.
packages/core/          Pure TypeScript domain — no React, no Next, no fetch,
                        which is why it tests fast and without a network.
  src/schemas.ts        Zod schemas for the three upstream feeds, plus the types
                        inferred from them — the only description of what the
                        vendor is allowed to send us.
  src/types.ts          The domain shapes this app serves to its own frontend
  src/normalize.ts      Resolves the defects in the raw KPI feed (R1, R2)
  src/quarters.ts       Quarter arithmetic and the canonical grid every series
                        is laid out on.
  src/metrics.ts        The two ratios the whole app is built from — margin and
                        growth — each with the guard that keeps it honest (R7).
  src/series.ts         Expands one company onto the grid and summarises it
                        (R3, R6, R9)
  src/aggregate.ts      Rolls companies up to fund level and builds the whole
                        portfolio in one pure call (R4, R5, R8).
  test/fixtures/        Upstream feeds, frozen byte-for-byte, so the suite never
                        reaches the network — each one lands when a test needs it.
  test/feeds.ts         Parses those files through the upstream schemas, which
                        makes schema drift fail every test that loads them.
  test/*.test.ts        One file per source module, each named after the rule it
                        defends rather than the function it calls.
```

## Architecture

Data moves in one direction, and the vendor's address stops at the server:

```
page (Server Component)  ──▶  /api/*  route handler
                                 │
                                 ├──▶  lib/upstream  ──fetch──▶  private-alpha.github.io
                                 │     network, env, Zod, cache
                                 └──▶  packages/core
                                       pure transformation, no I/O
```

The three feeds behind that last arrow are `funds.json`, `companies.json` and `kpis.json` under `https://private-alpha.github.io/takehome-seed-data/api/`.

**Network and transformation are separate layers on purpose.** `lib/upstream` knows about URLs, timeouts, caching and schema validation; `packages/core` receives arrays and returns arrays. That split is the whole reason the nine rules below can be tested exhaustively in milliseconds without a network, and it is why `core` holds no React, no Next and no `fetch`.

**The route handlers do no arithmetic.** `buildPortfolio` is a single pure call that turns the three raw feeds into the finished portfolio, and each handler only selects from its result. There is no second implementation of a growth rate living in a handler, which is the usual way two numbers on the same screen start disagreeing.

## API

Three read-only endpoints. Every response is JSON, and every one is assembled from the same `buildPortfolio` result.

| Endpoint                        | Responds with                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /api/funds`                | `{ funds: FundSummary[], dataQuality: DataQualityReport }`                           |
| `GET /api/funds/:fundId`        | `{ fund: FundSummary, companies: CompanySummary[], timeseries: FundQuarterPoint[] }` |
| `GET /api/companies/:companyId` | `{ company: CompanySummary, series: CompanyQuarterPoint[] }`                         |

The overview endpoint deliberately does **not** carry the 269 KPI rows it was built from — it answers in about 2 kB, because a card that shows a headline figure and a sparkline has no use for a quarterly time series it will never draw. The detail endpoints hand out the series, since that is what a drill-down is.

`dataQuality` rides along on the overview response rather than being logged and forgotten. It reports what the pipeline had to repair — `{ duplicatesResolved: 2, orphanKpiRows: 2, companiesWithoutKpis: 1 }` — and the UI shows it as a footnote. A pipeline that silently discards rows is indistinguishable from one that has a bug.

Errors answer in one shape, `{ error: { code, message } }`, with two codes:

| Status | Code                   | When                                             |
| ------ | ---------------------- | ------------------------------------------------ |
| `404`  | `not_found`            | no fund or company is held under that id         |
| `502`  | `upstream_unavailable` | the vendor answered badly, slowly, or not at all |

## Data assumptions

The upstream feeds are treated as a real-world source: they are inconsistent, and summing them naively produces numbers an investment manager would act on and regret. Every rule below exists because a specific defect was measured in the data, not because it sounded prudent.

**R1 — duplicate `(companyId, quarter)` keys resolve to the last occurrence.**
Two keys appear twice with conflicting figures: `co-014` / `2023-Q2` and `co-023` / `2025-Q1`. The feed is grouped by company and sorted by quarter, and both duplicates sit at the very end of the array, outside those sorted blocks. That is the signature of an append-only feed where a correction is appended rather than edited in place, so the later row is the restatement. Keeping the first row, or averaging the two, would preserve a figure the source has already superseded.

**R2 — KPI rows for unknown companies are dropped, and counted.**
`co-999` and `co-998` report KPIs but do not exist in the company feed, so they belong to no fund. Keeping them would leak revenue into portfolio-wide totals that no fund could account for. They are dropped rather than guessed at — but the count is carried through to the API response, because silently discarding data is how a pipeline hides its own bugs. Orphans are removed before deduplication, so the two counters describe disjoint sets of rows.

**R3 — every company is laid out on the same quarter grid, and a gap stays `null`.**
The grid runs from the earliest to the latest quarter anyone reported, which the data puts at `2023-Q1` through `2025-Q4`. It is derived rather than hardcoded, so a feed that grows a quarter does not need a code change. Three companies are missing quarters in the middle of their history rather than at the edges — `co-004`, `co-008` and `co-016` — and `co-008` skips all of 2024. Those quarters are filled with `null`, never `0` and never interpolated: a fabricated financial figure is worse than a missing one, because it cannot be told apart from a real one downstream. `missingQuarters` records which quarters carried no row at all, which is what the UI marks; that is a different thing from a row that was reported with a `null` metric in it, and the two are not merged.

**R4 — a quarterly total covers only the companies that reported it, and always travels with that count.**
`reportingCompanies` counts the companies behind the revenue figure standing next to it, which is a stricter test than "sent us a row". `fund-003` shows why: in `2024-Q3` four of its five companies submitted a row, but `co-009` submitted one with a null revenue, so the total rests on three companies rather than four. A badge reading "4 of 5" beside a number built from three would be exactly the kind of quiet inaccuracy this whole layer exists to prevent. Eleven of the twelve quarters contain at least one such row, so this is the normal case rather than an edge case. EBITDA and headcount are each summed over their own reported set; the coverage shown belongs to revenue, because revenue is the headline the badge annotates.

**R5 — growth is like-for-like: only companies that reported in both quarters count, in the numerator and in the base.**
This is the rule that makes the difference between a dashboard and a misleading one. `fund-003` again, comparing naive quarter-on-quarter totals against a like-for-like basis:

| Quarter | Naive QoQ | Like-for-like | Coverage |
| ------- | --------- | ------------- | -------- |
| 2023-Q2 | +60.0%    | **+9.4%**     | 5/5      |
| 2024-Q1 | −9.8%     | **+11.5%**    | 4/5      |
| 2024-Q3 | −35.7%    | **+8.2%**     | 3/5      |
| 2024-Q4 | +88.8%    | **+9.0%**     | 4/5      |
| 2025-Q3 | −30.6%    | **+8.5%**     | 4/5      |
| 2025-Q4 | +69.5%    | **+9.1%**     | 5/5      |

The fund grows at a steady 8–11% a quarter. The naive column swings between −36% and +89% and describes nothing but which companies happened to file that quarter. Seven of the eleven comparable quarters disagree materially. A fund-level EBITDA margin is computed the same way, over the companies that reported revenue _and_ EBITDA in that quarter, so the ratio never divides one company set by another.

**R6 — valuation is the last reported figure, carried forward, labelled with the quarter it came from.**
Only 96 of 269 rows carry a valuation, scattered irregularly. This is not a defect: a valuation is produced by a pricing event, not by the calendar. Carrying the last known figure forward is what a manager does mentally anyway, so the number is useful — but it is always shown with an "as of" quarter, because a valuation from four quarters ago and one from last quarter are not the same claim. The per-quarter series keeps valuations exactly where they were reported and does not carry them, so the drill-down chart shows the events rather than a staircase.

**R7 — negative EBITDA is valid data; a margin needs a positive revenue underneath it.**
113 of the 244 non-null EBITDA figures are negative, down to −55.0M. That is an ordinary growth portfolio, not corrupt data, so nothing is filtered on sign and six companies legitimately end on a negative margin. The margin itself is only computed when revenue is present and above zero — otherwise the result is `null` rather than a division by zero or a ratio against a figure nobody reported.

**R8 — the million-dollar unit is converted at the boundary; the domain is absolute USD throughout.**
`targetSizeMillionsUsd` is the only figure in the three feeds denominated in millions, while every revenue, EBITDA and valuation is absolute. Converting once, where the upstream shape becomes the domain shape, means nothing downstream has to remember which is which — and a fund's target size can sit next to its portfolio valuation without being wrong by six orders of magnitude.

**R9 — a company with no KPIs at all is still a company.**
`co-021` (Surge Technologies, fund-005) reports nothing. It gets a full-length series of nulls and a summary whose `latestQuarter` is `null`, so the fund page renders it as "not reporting" rather than as a company worth zero. Growth for any company is `null` when either endpoint is missing, which is why `co-008` has no year-on-year figure: its latest quarter is `2025-Q4` and the matching base sits inside its 2024 gap. Falling back to an older pair would have produced a plausible-looking number that no longer means "year on year as of the latest quarter".

## Decisions & trade-offs

**The server boundary is enforced by the build, not by convention.** `lib/env.ts` and `lib/upstream.ts` both open with `import 'server-only'`. If a Client Component ever pulls one of them in — directly, or through six layers of re-export — the build fails with a readable error instead of shipping the module to the browser. There is no secret in these files today; the guard is there because the boundary is the kind of rule that survives a code review and then quietly gets crossed three weeks later. For the same reason nothing here carries a `NEXT_PUBLIC_` prefix: that prefix inlines a value into the client bundle irreversibly, and an API layer that leaks its own upstream URLs has stopped being one.

`packages/core` deliberately does **not** get that guard, which is the trade-off half of the decision. It is pure transformation with no I/O, so tying it to a Next-specific package would cost it exactly the framework independence and the fast, network-free tests it exists for. It stays out of the client bundle by the weaker guarantee — nothing on the client imports it — and that is the right price here.

**The upstream is treated as untrusted input, even though it behaves today.** Every feed passes through its Zod schema before the domain sees it, so a vendor that starts sending revenue as a string produces a handled error naming the field rather than an `undefined.map()` five layers deeper. The fixtures are parsed through those same schemas, which is why schema drift fails the test suite as well as the request. Each call also carries `AbortSignal.timeout()`: an upstream that accepts the connection and then goes quiet is the failure mode that hurts most, because without a deadline it holds the request open until something else gives up first.

**An error tells the client what it can act on and nothing else.** When the upstream fails, the caller gets `502 upstream_unavailable` and a fixed sentence; the vendor's URL, its status code and the stack trace go to the server log where they are actually useful. The same reasoning removed the id from the 404 message: echoing `../../etc/passwd` back at whoever sent it is a reflection surface that buys nothing, because the client already knows what it asked for.

**There is no format check on `:fundId` and `:companyId`, and that is deliberate.** A regex like `^(fund|co)-\d+$` would look like validation while guarding nothing — the parameter never reaches a filesystem, an outbound URL or a query, it is only compared against ids already in memory. What such a pattern would reliably do is reject a valid id the day the vendor ships `fund-A1`. The lookup is the validation: no match, `404`.

**Freshness is configured in one place, not three.** `lib/upstream` passes `next: { revalidate }` on each feed, so Next's Data Cache holds the vendor payload; the handlers add a matching `Cache-Control` so a shared cache can hold the assembled response. What is deliberately absent is a per-route `revalidate` segment export: it has to be a static literal, so it could not follow `UPSTREAM_REVALIDATE_SECONDS` and would silently disagree with the other two the moment anyone changed it.

**Deliberately left out: rate limiting, auth, CSRF tokens, secret rotation.** This app serves public, read-only data, holds no session and performs no mutation, so each of these would be a lock on a door that does not exist. They are named here rather than silently skipped, because from the outside an omission and an oversight look identical.

## Testing

The risk in this project is not in rendering, it is in the transformation. A misplaced margin is visible the moment the page loads; a fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. Tests follow the risk, so the weight sits in `packages/core`.

Fixtures are frozen copies of the upstream feeds, complete rather than trimmed on purpose: their value is that they reproduce the real payload including every defect, and hand-picking rows is how a fixture quietly stops resembling the source it stands in for. Nothing in the suite touches the network, so neither an upstream outage nor a reseed of the vendor data can turn the build red without anyone having changed the code. A feed is committed at the point a test first reads it, not before.

Covered so far, 34 tests over the frozen feeds:

**Normalisation** — the two conflicting duplicates resolve to their later row. The pair is chosen deliberately: `co-014` is restated upwards and `co-023` downwards, so the assertion distinguishes "last wins" from "largest wins", which a single duplicate could not (R1). A corrected row keeps its chronological position rather than jumping to the end of its block. Orphan rows disappear, and the discarded and merged counts add up against the raw row count, so nothing vanishes unaccounted for (R2). Reported nulls survive as nulls and no zero is invented.

**The quarter grid** — it spans the full reporting window found in the feed, fills quarters nobody reported, and returns nothing at all rather than a partial grid when no quarter is readable. Quarter arithmetic is checked across year boundaries in both directions, because an off-by-one there would silently compare the wrong two quarters and every number downstream would still look plausible.

**Company series** — an unreported quarter stays null rather than zero, and `missingQuarters` names exactly the quarters that carried no row (R3). The distinction that matters most has its own test: `co-009` filed a row for `2024-Q3` with a null revenue in it, and that quarter must _not_ appear as missing, because a company that reported without a figure is not the same as a company that stayed silent. `co-021` produces a full-length empty series and a summary of nulls instead of throwing or reporting zero (R9). `co-014`, which has exactly one pricing event, carries that valuation forward across the seven quarters that follow it, with the right "as of" label, while its per-quarter series keeps the single event where it happened (R6). A loss passes through as a negative margin, and a margin with no revenue underneath comes back null (R7).

**Fund aggregation** — the one figure quoted in millions converts once at the boundary (R8). Coverage counts the companies behind the revenue figure rather than the ones that sent a row, and is asserted to drop from four to three in the quarter `fund-003`'s total drops (R4). A silent company stays in the denominator so the gap remains visible.

**Like-for-like growth** — the headline test (R5). `fund-003`'s `2024-Q3` total is 36% below the previous quarter; measured over the companies present in both quarters it is an 8% increase. Both numbers are asserted against sums written out by hand rather than against whatever the implementation happened to return. A second test pins down that an excluded company leaves the base as well as the numerator, which is the half of the rule that is easy to get wrong and impossible to see. Growth comes back null when the two quarters share no company at all, rather than producing a rate from an empty set.

Both rules the dashboard rests on were mutation-checked: inverting the coverage definition fails two tests, removing the like-for-like filter fails three. A test that still passes against a broken implementation is decoration, and these do not.

**Not covered, deliberately.** Nothing asserts that a chart draws a particular path, and there is no end-to-end suite. Rendering defects announce themselves the moment the page loads; an aggregate computed over the wrong set of companies looks entirely reasonable and is wrong by tens of millions. The effort follows the second kind.
