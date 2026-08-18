# INTRINSIQ Portfolio

A dashboard for investment managers: browse funds, inspect the companies inside each one, and read fund-level performance aggregated from them.

The browser never talks to the vendor. All three feeds are fetched, validated and reshaped inside the app's own API layer.

## Tech stack

| Layer           | Choice                            | Version        |
| --------------- | --------------------------------- | -------------- |
| Runtime         | Node.js (LTS "Krypton")           | 24.19.0        |
| Package manager | pnpm, pinned via Corepack         | 11.21.0        |
| Monorepo        | Turborepo + pnpm workspaces       | 2.10.9         |
| Framework       | Next.js (App Router)              | 16.3.0         |
| UI runtime      | React                             | 19.2.8         |
| Language        | TypeScript, `strict`              | 6.0.3          |
| Validation      | Zod, at the upstream boundary     | 4.4.3          |
| Linting         | ESLint (flat config) + Prettier   | 9.39.5 / 3.9.6 |
| Tests           | Vitest                            | 4.1.10         |
| Interactive     | Radix UI, styled with CSS Modules | 2.3.7          |
| Charts          | Recharts, on the detail page only | 3.10.1         |

Layout is plain CSS Modules over a shared token file. A library appears only where it earns its place — one select, and one chart.

## Getting started

Node.js 24.19.0 and Corepack:

```bash
nvm use          # reads .nvmrc
corepack enable  # activates the pinned pnpm
pnpm install
pnpm dev
```

`.npmrc` sets `engine-strict=true`, so an unsupported Node version stops `pnpm install` rather than failing later in a confusing way.

**No `.env` is needed.** The three feed URLs, the timeout (`5000` ms) and the cache window (`3600` s) ship with defaults, overridable through `UPSTREAM_FUNDS_URL`, `UPSTREAM_COMPANIES_URL`, `UPSTREAM_KPIS_URL`, `UPSTREAM_TIMEOUT_MS` and `UPSTREAM_REVALIDATE_SECONDS`. They are validated as the config loads, so a bad value fails at once with the field named.

## Scripts

```sh
pnpm dev           # Development server on `localhost:3000`
pnpm build         # Production build across the workspace graph
pnpm start         # Serves the production build
pnpm lint          # ESLint, warnings treated as errors
pnpm typecheck     # Route type generation, then `tsc --noEmit`
pnpm test          # Vitest, once, across the workspace graph
pnpm format        # Rewrites files with Prettier
pnpm format:check  # Verifies formatting without writing
```

## Project structure

```
intrinsiq-portfolio/
├── apps/web/                     Next.js application
│   ├── app/
│   │   ├── layout.tsx            App-level only: fonts, metadata, the frame
│   │   ├── globals.css           The reset, over the tokens the ui package ships
│   │   ├── (overview)/           The `/` route; the parentheses keep it out of the URL
│   │   │   ├── page.tsx          The fund overview, a Server Component
│   │   │   └── _components/      Underscore: route-local, never a URL segment
│   │   │       ├── FundCard.tsx  One fund as a card; it builds `/funds/:id`
│   │   │       └── FundFilters.tsx  The only `use client` in the app
│   │   ├── funds/[fundId]/       The fund drill-down, with its own components
│   │   │   ├── page.tsx          Header, trend chart, coverage rail, company table
│   │   │   └── _components/      KpiChart, CoverageStrip, CompanyTable
│   │   └── api/                  The API layer — the only caller of a vendor URL
│   ├── lib/
│   │   ├── env.ts                The only reader of the environment, validated once
│   │   ├── upstream.ts           The only module that touches the network
│   │   ├── portfolio.ts          What the pages read, over the app's own HTTP API
│   │   ├── labels.ts             One source for the words a code maps to
│   │   ├── chart.ts              The chart's spoken description, as a pure function
│   │   └── api.ts                Shared response shapes: cache header, 404, 502
│   └── test/                     The API contract, and the vendor failing
├── packages/ui/                  Presentational only — props in, JSX out
│   ├── src/components/           Where `./*` resolves — the public surface
│   │   ├── Sparkline.tsx         Hand-written SVG; a gap breaks the line
│   │   └── Icon.tsx              Monochrome glyphs, coloured by their holder
│   ├── src/layouts/              Only `App` is exported, so the chrome stays paired
│   │   ├── App.tsx               Skip link, the one <main>, footer pinned bottom
│   │   ├── Navbar.tsx            Sticky bar carrying the brand
│   │   └── Footer.tsx            The copyright line, and nothing else
│   ├── src/primitives/           Third-party behaviour, our styling
│   │   └── Select.tsx            Radix listbox; the one client component here
│   ├── src/styles/tokens.css     Colour, space, radius, type and motion, one scale
│   ├── src/lib/                  Pure functions: sparkline geometry, formatting
│   └── src/types/                Ambient declarations, nothing importable
└── packages/core/                Pure TypeScript domain — no React, no Next, no fetch
    ├── src/schemas.ts            What the vendor is allowed to send us
    ├── src/types.ts              What this app serves to its own frontend
    ├── src/normalize.ts          Defects in the raw KPI feed (R1, R2)
    ├── src/quarters.ts           Quarter arithmetic and the canonical grid
    ├── src/metrics.ts            Margin and growth, each with its guard (R7)
    ├── src/series.ts             One company, expanded onto the grid (R3, R6, R9)
    ├── src/aggregate.ts          Companies rolled up to funds (R4, R5, R8)
    └── test/fixtures/            The real feeds, frozen byte-for-byte
```

The three "only" lines above are the monorepo's justification: `core` holds no I/O so it tests without a network, `ui` holds no domain so it cannot drift from the data, and one module in `web` owns the network so the boundary is enforceable.

## Architecture

```
page (Server Component)  ──▶  /api/*  route handler
                                 │
                                 ├──▶  lib/upstream  ──fetch──▶  private-alpha.github.io
                                 └──▶  packages/core
```

The feeds are `funds.json`, `companies.json` and `kpis.json` under `https://private-alpha.github.io/takehome-seed-data/api/`.

`lib/upstream` owns URLs, timeouts, caching and validation; `packages/core` takes arrays and returns arrays. That split is why the nine rules below can be tested exhaustively in milliseconds without a network. `buildPortfolio` is a single pure call and the handlers only select from its result, so no growth rate is implemented twice.

## API

| Endpoint                        | Responds with                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /api/funds`                | `{ funds: FundSummary[], dataQuality: DataQualityReport }`                           |
| `GET /api/funds/:fundId`        | `{ fund: FundSummary, companies: CompanySummary[], timeseries: FundQuarterPoint[] }` |
| `GET /api/companies/:companyId` | `{ company: CompanySummary, series: CompanyQuarterPoint[] }`                         |

The pages consume these endpoints over HTTP rather than importing the loader, which is what the spec asks for — the API layer is load-bearing, not decorative. `/funds/:fundId` renders Next's own not-found page when the API says no fund is held under that id.

Errors answer as `{ error: { code, message } }` — `404 not_found`, or `502 upstream_unavailable` when the vendor answers badly, slowly, or not at all.

The overview carries each fund's **aggregated** twelve-quarter series and the names of the companies in it — about 10 kB in total — but none of the 269 company KPI rows those figures were built from. That is the line: a card draws a sparkline and lists its holdings, so it needs both; it never needs a company's quarterly filings, which is what the detail endpoints are for. `dataQuality` rides along on the overview, because a pipeline that silently discards rows is indistinguishable from one that has a bug.

## Data assumptions

The feeds are inconsistent, and summing them naively produces numbers a manager would act on and regret. Every rule below exists because a defect was measured.

**R1 — duplicate `(companyId, quarter)` keys resolve to the last row.** `co-014`/`2023-Q2` and `co-023`/`2025-Q1` appear twice with conflicting figures, both at the very end of an otherwise grouped and sorted array — an append-only correction, so the later row is the restatement.

**R2 — rows for unknown companies are dropped, and counted.** `co-999` and `co-998` belong to no fund; keeping them would leak revenue no fund could account for, so the count travels to the API response instead of vanishing.

**R3 — every company sits on the same derived quarter grid (`2023-Q1`–`2025-Q4`), and a gap stays `null`.** `co-004`, `co-008` and `co-016` are missing quarters mid-history, `co-008` all of 2024. Never `0`, never interpolated: a fabricated financial figure cannot be told apart from a real one downstream.

**R4 — a quarterly total travels with the count of companies behind it.** `reportingCompanies` counts companies with a revenue figure, which is stricter than "sent us a row": in `fund-003`/`2024-Q3` four of five filed, but `co-009` filed a null revenue, so the total rests on three. Eleven of the twelve quarters contain such a row.

**R5 — growth is like-for-like: only companies reporting in both quarters count, in the numerator and the base.** `fund-003`, naive against like-for-like:

| Quarter | Naive QoQ | Like-for-like | Coverage |
| ------- | --------- | ------------- | -------- |
| 2023-Q2 | +60.0%    | **+9.4%**     | 5/5      |
| 2024-Q1 | −9.8%     | **+11.5%**    | 4/5      |
| 2024-Q3 | −35.7%    | **+8.2%**     | 3/5      |
| 2024-Q4 | +88.8%    | **+9.0%**     | 4/5      |
| 2025-Q3 | −30.6%    | **+8.5%**     | 4/5      |
| 2025-Q4 | +69.5%    | **+9.1%**     | 5/5      |

The fund grows at a steady 8–11% a quarter. The naive column swings between −36% and +89% and describes nothing but who happened to file. Fund EBITDA margin uses the same intersection, so the ratio never divides one company set by another.

**R6 — valuation is the last reported figure, carried forward, labelled "as of".** Only 96 of 269 rows carry one, because a valuation comes from a pricing event rather than the calendar.

**R7 — negative EBITDA is valid; a margin needs positive revenue underneath it.** 113 of the 244 non-null EBITDA figures are negative, down to −55.0M — an ordinary growth portfolio, so nothing is filtered on sign.

**R8 — the million-dollar unit converts at the boundary.** `targetSizeMillionsUsd` is the only figure quoted in millions, so it is converted once, where the upstream shape becomes the domain shape.

**R9 — a company with no KPIs is still a company.** `co-021` renders as "not reporting", never as zero. Growth is `null` when either endpoint is missing, which is why `co-008` has no year-on-year figure: its base quarter sits inside its 2024 gap.

## Decisions & trade-offs

- **`server-only` on `lib/env` and `lib/upstream`.** A Client Component importing either breaks the build instead of shipping it to the browser. Measured on the production build: the vendor host appears zero times in the client bundle.
- **`packages/core` gets no such guard** — the trade-off half. Tying it to a Next-specific package would cost the framework independence and the network-free tests it exists for.
- **One token scale, not two.** Colour, spacing, radius, type and motion live in one file, and the Radix primitives read the same variables — a second scale is how an interface ends up looking assembled rather than designed.
- **Radix rather than shadcn/ui, and therefore no Tailwind.** A native `<select>` dropdown is drawn by the operating system and cannot be styled to match the page. shadcn _is_ Radix wrapped in Tailwind classes; taking Radix directly gives the identical listbox, keyboard handling and ARIA, while the app keeps one styling system instead of two.
- **Filtering and sorting live in the URL, not in component state.** The controls are the only `'use client'` in the app. Client state would have pulled every card, figure and sparkline into the bundle to avoid one round trip — and a filtered view would not survive a refresh or a paste into Slack.
- **The sparkline is hand-written SVG, not a chart library.** Recharts requires `'use client'`, which would turn the fund card and every value it renders into client JavaScript instead of server-rendered HTML. A charting library appears on the fund detail page, where axes, tooltips and two series earn it.
- **The company table stays a table at every width.** Cards would destroy the column alignment that "which company is dragging the fund" depends on, and would mean a second markup tree that has to rebuild `<caption>` and `<th scope>` and still cannot offer navigation by column. The narrow-screen cost is paid by a sticky first column and a focusable scroll region instead.
- **The upstream is untrusted input.** Zod at the boundary and `AbortSignal.timeout()` on every call, so a schema break is a handled `502` rather than an `undefined.map()` five layers deeper.
- **Errors say only what the client can act on.** The vendor's URL, status and stack trace go to the server log; the 404 does not echo the requested id back.
- **No format check on `:fundId` and `:companyId`.** The parameter never reaches a filesystem or an outbound URL, and a regex would reject a valid id the day the vendor ships `fund-A1`. The lookup is the validation.
- **Freshness is configured once.** `next: { revalidate }` on the fetch plus a matching `Cache-Control`. No per-route `revalidate` export, which must be a static literal and so could not follow the env value.
- **Deliberately absent:** rate limiting, auth, CSRF tokens, secret rotation. Public read-only data, no session, no mutation.

## Testing

The risk is in the transformation, not the rendering. A misplaced margin is visible the moment the page loads; a fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. Neither suite touches the network.

**Domain — 34 tests** over frozen, complete copies of the real feeds. Complete rather than trimmed, because hand-picking rows is how a fixture quietly stops resembling its source. The cases are chosen so that passing cannot be a coincidence: `co-014` is restated upwards and `co-023` downwards, which separates "last wins" from "largest wins"; `co-009`'s null revenue must count as reported but not towards coverage; like-for-like growth is asserted against sums written out by hand. Both headline rules were mutation-checked — inverting coverage fails two tests, removing the like-for-like filter fails three.

**API — 19 tests** against a stubbed vendor. The arithmetic is already proved; what is unproved here is the contract. A `500`, a schema break and a silent hang all become the same `502`, and two tests pin down what that response may contain: the body must not hold the vendor's host, status or a stack frame, while the log must hold all three. Leak and swallow are opposite mistakes.

**Presentation and page logic — 42 tests.** The pure parts carry the weight — sparkline geometry, where a gap ends one run and starts another rather than being drawn through; formatting, where absolute USD has to read back as `$102.0M` and a missing figure as an em dash; and filtering, sorting and the portfolio headline, which is R4 one level up and whose sort, when mutated away, fails two tests. Components are queried by role rather than by test id, so a test fails when the markup stops being a real table, when a `<label>` comes loose from its combobox, or when growth stops being announced in words as well as by colour and a glyph. `axe-core` runs over the rendered card and table; colour contrast needs a real canvas, so those ratios were computed separately. The chart is tested through its text equivalent rather than its paths: the spoken description is a pure function asserted directly, and the hidden table is asserted to carry every figure — including an em dash where the drawing simply has a break.

Six tests were removed rather than added, because none of them could fail against a broken implementation — the only bar a test has to clear.

**Not covered, deliberately.** No assertions on the SVG the chart library emits, and no end-to-end suite. Rendering defects announce themselves on load; wrong aggregates do not.
