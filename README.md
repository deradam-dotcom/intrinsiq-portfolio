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

Layout is plain CSS Modules over a shared token file. A component library appears only where a primitive earns it — so far, one select.

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
│   │   └── api/                  The API layer — the only caller of a vendor URL
│   ├── lib/
│   │   ├── env.ts                The only reader of the environment, validated once
│   │   ├── upstream.ts           The only module that touches the network
│   │   ├── portfolio.ts          What the pages read, over the app's own HTTP API
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

Errors answer as `{ error: { code, message } }` — `404 not_found`, or `502 upstream_unavailable` when the vendor answers badly, slowly, or not at all.

The overview carries each fund's **aggregated** twelve-quarter series and the names of the companies in it — about 10 kB in total — but none of the 269 company KPI rows those figures were built from. That is the line: a card draws a sparkline and lists its holdings, so it needs both; it never needs a company's quarterly filings, which is what the detail endpoints are for. `dataQuality` rides along on the overview, because a pipeline that silently discards rows is indistinguishable from one that has a bug.

## Data assumptions

The feeds are inconsistent, and summing them naively produces numbers a manager would act on and regret. Every rule exists because a defect was measured, not because it sounded prudent.

**R1 — duplicate `(companyId, quarter)` keys resolve to the last row.** `co-014`/`2023-Q2` and `co-023`/`2025-Q1` appear twice with conflicting figures, both sitting at the very end of an otherwise company-grouped, quarter-sorted array. That is an append-only correction, so the later row is the restatement — not the first, and not an average.

**R2 — rows for unknown companies are dropped, and counted.** `co-999` and `co-998` belong to no fund; keeping them would leak revenue no fund could account for. The count travels to the API response rather than vanishing.

**R3 — every company sits on the same quarter grid, and a gap stays `null`.** The grid is derived from the data, not hardcoded (`2023-Q1`–`2025-Q4`). `co-004`, `co-008` and `co-016` are missing quarters mid-history, and `co-008` skips all of 2024. Never `0`, never interpolated: a fabricated financial figure cannot be told apart from a real one downstream.

**R4 — a quarterly total travels with the count of companies behind it.** `reportingCompanies` counts companies with a revenue figure, which is stricter than "sent us a row". In `fund-003`/`2024-Q3` four of five filed, but `co-009` filed a null revenue, so the total rests on three. Eleven of the twelve quarters contain such a row, so this is the normal case.

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

**R6 — valuation is the last reported figure, carried forward, labelled "as of".** Only 96 of 269 rows carry one, because a valuation comes from a pricing event rather than the calendar. The per-quarter series keeps events where they happened, so the drill-down shows events instead of a staircase.

**R7 — negative EBITDA is valid; a margin needs positive revenue underneath it.** 113 of the 244 non-null EBITDA figures are negative, down to −55.0M — an ordinary growth portfolio, not corrupt data. Nothing is filtered on sign, and the margin is `null` rather than a division by zero.

**R8 — the million-dollar unit converts at the boundary.** `targetSizeMillionsUsd` is the only figure quoted in millions, so it is converted once, where the upstream shape becomes the domain shape.

**R9 — a company with no KPIs is still a company.** `co-021` reports nothing and renders as "not reporting", never as zero. Growth is `null` when either endpoint is missing, which is why `co-008` has no year-on-year figure: its base quarter sits inside its 2024 gap.

## Decisions & trade-offs

- **`server-only` on `lib/env` and `lib/upstream`.** A Client Component importing either breaks the build instead of shipping it to the browser, and nothing carries a `NEXT_PUBLIC_` prefix. Measured on the production build: the vendor host appears zero times in the client bundle.
- **`packages/core` gets no such guard** — the trade-off half. Tying it to a Next-specific package would cost the framework independence and the network-free tests it exists for. It stays out of the bundle by the weaker guarantee that nothing on the client imports it.
- **One token scale, not two.** Colour, spacing, radius, type and motion live in `packages/ui/src/styles/tokens.css`, and the shadcn primitives will be pointed at the same variables — a second scale is how an interface ends up looking assembled rather than designed. Contrast was computed, not eyeballed: every text pair clears WCAG AA at 4.9:1 or better, and a border that carries meaning clears 3:1.
- **Radix rather than shadcn/ui, and therefore no Tailwind.** A select needs behaviour a native `<select>` cannot give: its dropdown is drawn by the operating system and cannot be styled to match the page. shadcn provides that behaviour — but shadcn _is_ Radix wrapped in Tailwind classes, plus `lucide-react` for two glyphs and `cn()` for merging utility strings. Taking Radix directly gives the identical listbox, keyboard handling and ARIA, while the app keeps **one** styling system instead of two, and the Tailwind preflight never gets the chance to fight the base CSS it would have landed on top of.

  What we declined was therefore not functionality but shadcn's _styling opinion_ — and that opinion had nothing to replace here, because the token scale was already in place with its contrast ratios computed. shadcn's value is consistent visual decisions across fifty components; at one select that benefit does not exist, while the side effects do. The cost is honest and ongoing: every further primitive gets hand-written CSS rather than arriving pre-styled.

- **Filtering and sorting live in the URL, not in component state.** The controls are the only `'use client'` in the app; they write `?strategy=…&sort=…` and the server re-renders the filtered list. Holding the funds in client state would have pulled every card, figure and sparkline into the bundle to avoid one round trip — and a filtered view would not survive a refresh or a paste into Slack.
- **The sparkline is hand-written SVG, not a chart library.** The saving is not the ~100 kB: Recharts requires `'use client'`, which would turn the fund card — and every value it renders — into client JavaScript instead of server-rendered HTML. Inline SVG is markup, so the overview page stays entirely a Server Component. A charting library appears on the fund detail page, where axes, tooltips and two series earn it.
- **The upstream is untrusted input.** Zod at the boundary and `AbortSignal.timeout()` on every call, so a schema break is a handled `502` rather than an `undefined.map()` five layers deeper.
- **Errors say only what the client can act on.** The vendor's URL, status and stack trace go to the server log; the 404 does not echo the requested id back.
- **No format check on `:fundId` and `:companyId`.** A regex would guard nothing — the parameter never reaches a filesystem or an outbound URL — and would reject a valid id the day the vendor ships `fund-A1`. The lookup is the validation.
- **Freshness is configured once.** `next: { revalidate }` on the fetch plus a matching `Cache-Control`. No per-route `revalidate` export, which must be a static literal and so could not follow the env value.
- **Deliberately absent:** rate limiting, auth, CSRF tokens, secret rotation. Public read-only data, no session, no mutation.

## Testing

The risk is in the transformation, not the rendering. A misplaced margin is visible the moment the page loads; a fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. Neither suite touches the network.

**Domain — 34 tests over frozen, complete copies of the real feeds.** Complete rather than trimmed, because hand-picking rows is how a fixture quietly stops resembling its source. The cases are chosen so that passing cannot be a coincidence: both duplicates, since `co-014` is restated upwards and `co-023` downwards, which separates "last wins" from "largest wins"; `co-009`'s null revenue, which must count as reported but not towards coverage; like-for-like growth asserted against sums written out by hand, with a second test proving an excluded company leaves the base as well as the numerator. Both headline rules were mutation-checked — inverting coverage fails two tests, removing the like-for-like filter fails three.

**API — 17 tests against a stubbed vendor.** Not the fixtures: the arithmetic is already proved, what is unproved here is the contract. A `500`, a schema break and a silent hang all become the same `502`, and two tests pin down what that response may contain — the body must not hold the vendor's host, status or a stack frame, while the log must hold all three. Leak and swallow are opposite mistakes.

**Presentation — 27 tests.** The pure parts carry the weight: the sparkline's coordinate maths is asserted directly, including that a gap ends one run and starts another rather than being drawn through, and that a lone reported quarter survives as its own run. Formatting is checked because a figure the domain keeps in absolute USD has to read back as `$102.0M`, and a missing one as an em dash rather than a zero.

The fund card is queried by role, not by test id, so the test fails if the heading stops being a heading. Three behaviours are pinned: the growth direction is announced in words and not only by a glyph and a colour; the coverage warning appears in prose when the headline rests on fewer companies than the fund holds, and stays silent when it does not; and the warning describes the quarter the headline came from, not whichever quarter sits last on the grid. `axe-core` runs over the rendered card and finds nothing — though not colour contrast, which needs a real canvas, so those ratios were computed separately.

Filtering and sorting are tested as pure functions rather than through the UI, because that is where they run: a fund that reported nothing sinks to the bottom instead of ranking as zero, and sorting hands back a new array rather than reordering the caller's. The controls themselves are queried by role — `combobox` with an accessible name — so the test fails if a label stops being attached, and the live region is asserted to announce how much of the list survived.

**Not covered, deliberately.** No chart-path assertions and no end-to-end suite. Rendering defects announce themselves on load; wrong aggregates do not.
