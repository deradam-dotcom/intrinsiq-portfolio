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
  app/                  App Router: layouts, pages and the API layer
packages/core/          Pure TypeScript domain — no React, no Next, no fetch,
                        which is why it tests fast and without a network
  src/schemas.ts        Zod schemas for the three upstream feeds, plus the types
                        inferred from them — the only description of what the
                        vendor is allowed to send us
  src/types.ts          The domain shapes this app serves to its own frontend
  src/normalize.ts      Resolves the defects in the raw KPI feed (R1, R2)
  test/fixtures/        Upstream feeds, frozen byte-for-byte, so the suite never
                        reaches the network — each one lands when a test needs it
  test/fixtures.ts      Parses those files through the upstream schemas, which
                        makes schema drift fail every test that loads them
```

## Data assumptions

The upstream feeds are treated as a real-world source: they are inconsistent, and summing them naively produces numbers an investment manager would act on and regret. Every rule below exists because a specific defect was measured in the data, not because it sounded prudent.

**R1 — duplicate `(companyId, quarter)` keys resolve to the last occurrence.**
Two keys appear twice with conflicting figures: `co-014` / `2023-Q2` and `co-023` / `2025-Q1`. The feed is grouped by company and sorted by quarter, and both duplicates sit at the very end of the array, outside those sorted blocks. That is the signature of an append-only feed where a correction is appended rather than edited in place, so the later row is the restatement. Keeping the first row, or averaging the two, would preserve a figure the source has already superseded.

**R2 — KPI rows for unknown companies are dropped, and counted.**
`co-999` and `co-998` report KPIs but do not exist in the company feed, so they belong to no fund. Keeping them would leak revenue into portfolio-wide totals that no fund could account for. They are dropped rather than guessed at — but the count is carried through to the API response, because silently discarding data is how a pipeline hides its own bugs. Orphans are removed before deduplication, so the two counters describe disjoint sets of rows.

## Testing

The risk in this project is not in rendering, it is in the transformation. A misplaced margin is visible the moment the page loads; a fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. Tests follow the risk, so the weight sits in `packages/core`.

Fixtures are frozen copies of the upstream feeds, complete rather than trimmed on purpose: their value is that they reproduce the real payload including every defect, and hand-picking rows is how a fixture quietly stops resembling the source it stands in for. Nothing in the suite touches the network, so neither an upstream outage nor a reseed of the vendor data can turn the build red without anyone having changed the code. A feed is committed at the point a test first reads it, not before.

Covered so far:

- **R1** — the two conflicting duplicates resolve to their later row. The pair is chosen deliberately: `co-014` is restated upwards and `co-023` downwards, so the assertion distinguishes "last wins" from "largest wins", which a single duplicate could not.
- **R1** — a corrected row keeps its chronological position rather than jumping to the end of the company's block.
- **R2** — orphan rows disappear, and the discarded and merged counts add up against the raw row count, so nothing vanishes unaccounted for.
- Reported nulls survive normalisation as nulls, and no zero is invented anywhere.
