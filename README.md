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

No environment variables are required to run the project. Upstream data URLs ship as defaults; see the Configuration section once it lands.

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
  app/                  App Router: layouts, pages and the API layer.
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
  test/fixtures.ts      Parses those files through the upstream schemas, which
                        makes schema drift fail every test that loads them.
```

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

## Testing

The risk in this project is not in rendering, it is in the transformation. A misplaced margin is visible the moment the page loads; a fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. Tests follow the risk, so the weight sits in `packages/core`.

Fixtures are frozen copies of the upstream feeds, complete rather than trimmed on purpose: their value is that they reproduce the real payload including every defect, and hand-picking rows is how a fixture quietly stops resembling the source it stands in for. Nothing in the suite touches the network, so neither an upstream outage nor a reseed of the vendor data can turn the build red without anyone having changed the code. A feed is committed at the point a test first reads it, not before.

Covered so far:

- **R1** — the two conflicting duplicates resolve to their later row. The pair is chosen deliberately: `co-014` is restated upwards and `co-023` downwards, so the assertion distinguishes "last wins" from "largest wins", which a single duplicate could not.
- **R1** — a corrected row keeps its chronological position rather than jumping to the end of the company's block.
- **R2** — orphan rows disappear, and the discarded and merged counts add up against the raw row count, so nothing vanishes unaccounted for.
- Reported nulls survive normalisation as nulls, and no zero is invented anywhere.
