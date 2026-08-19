# INTRINSIQ Portfolio

A dashboard for investment managers: browse funds, open a fund to see the companies inside it, and read fund-level performance aggregated from those companies.

The browser never talks to the vendor. All three feeds are fetched, validated and reshaped in the app's own API layer.

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
| Charts          | Recharts, on the detail pages     | 3.10.1         |

Layout is plain CSS Modules over a shared token file. I reached for a library twice: one select, one chart.

## Getting started

Node.js 24.19.0 and Corepack:

```bash
nvm use          # reads .nvmrc
corepack enable  # activates the pinned pnpm
pnpm install
pnpm dev
```

`.npmrc` sets `engine-strict=true`, so an unsupported Node version stops `pnpm install` instead of failing later in a confusing way.

**No `.env` is needed.** The three feed URLs, the timeout (`5000` ms) and the cache window (`3600` s) ship with defaults. You can override them with `UPSTREAM_FUNDS_URL`, `UPSTREAM_COMPANIES_URL`, `UPSTREAM_KPIS_URL`, `UPSTREAM_TIMEOUT_MS` and `UPSTREAM_REVALIDATE_SECONDS`. They're validated as the config loads, so a bad value fails at once with the field named.

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
├── apps/web/                     The Next.js app: the pages and the API layer.
│   ├── app/
│   │   ├── layout.tsx            Fonts, metadata, and the frame every page sits in.
│   │   ├── loading.tsx           What you see while a page is still loading.
│   │   ├── error.tsx             The error boundary. A message and a retry button.
│   │   ├── not-found.tsx         The 404 page.
│   │   ├── globals.css           The reset, the base elements, and the panel those two share.
│   │   ├── _components/
│   │   │   └── LoadingSkeleton.tsx  The grey placeholder blocks, and a spoken "loading".
│   │   ├── (overview)/           The `/` route. The parentheses keep it out of the URL.
│   │   │   ├── page.tsx          The fund overview. A Server Component.
│   │   │   └── _components/      The underscore means route-local: never a URL segment.
│   │   │       ├── FundCard.tsx     One fund as a card, linking through to its page.
│   │   │       └── FundFilters.tsx  Strategy, status and sort. The only `use client`.
│   │   ├── funds/[fundId]/       The fund page.
│   │   │   ├── page.tsx          Header, KPIs, the chart, the coverage rail, the table.
│   │   │   ├── _components/      KpiChart, CoverageStrip and CompanyTable.
│   │   │   └── companies/[companyId]/  The company page, nested under the fund that holds it.
│   │   │       ├── page.tsx      Its own KPIs, the same chart, and its valuation events.
│   │   │       └── _components/  ValuationEvents.
│   │   └── api/                  The API layer. The only code that calls a vendor URL.
│   ├── lib/
│   │   ├── env.ts                Reads the environment and validates it, once.
│   │   ├── upstream.ts           Fetches the three feeds. The only module on the network.
│   │   ├── portfolio.ts          How a page reads the app's own API.
│   │   ├── labels.ts             Turns codes into words: `venture_capital` into "Venture capital".
│   │   ├── chart.ts              The chart's point type, and the sentence read out in its place.
│   │   └── api.ts                The shared responses: cache header, 404, 502.
│   └── test/                     The API contract, the components, and the vendor failing.
├── packages/ui/                  Presentational only. Props in, JSX out.
│   ├── src/components/           The public surface, as in `@intrinsiq/ui/Sparkline`.
│   │   ├── Sparkline.tsx         Hand-written SVG. A gap in the data breaks the line.
│   │   ├── Breadcrumbs.tsx       A `<nav>` and an `<ol>`, last item marked as current.
│   │   └── Icon.tsx              Inline SVG icons. They take their colour from the parent.
│   ├── src/layouts/              The page chrome. Only `App` is exported, so it stays paired.
│   │   ├── App.tsx               The skip link, the navbar, the one `<main>`, the footer.
│   │   ├── Navbar.tsx            A sticky bar with the brand in it.
│   │   └── Footer.tsx            The copyright line.
│   ├── src/primitives/           Radix behaviour, styled by us.
│   │   ├── Select.tsx            The Radix select, behind four props.
│   │   └── Popover.tsx           The Radix popover. Hover, focus and tap all open it.
│   ├── src/styles/tokens.css     Every colour, space, radius, type size and duration.
│   ├── src/lib/                  Pure helpers: sparkline geometry and number formatting.
│   └── src/types/                Ambient types, so TypeScript understands a CSS import.
└── packages/core/                The pure domain. No React, no Next, no fetch.
    ├── src/schemas.ts            What the vendor is allowed to send, as Zod schemas.
    ├── src/types.ts              The types this app serves to its own frontend.
    ├── src/normalize.ts          Cleans up the raw KPI feed (R1, R2).
    ├── src/quarters.ts           Quarter arithmetic, and the twelve-quarter grid.
    ├── src/metrics.ts            Margin and growth, each with its guard (R7).
    ├── src/series.ts             One company laid out across the grid (R3, R6, R9).
    ├── src/aggregate.ts          Companies rolled up into funds (R4, R5, R8).
    └── test/fixtures/            The three real feeds, copied without a single edit.
```

Three boundaries are what make the monorepo worth having. `core` does no I/O, so it tests without a network. `ui` holds no domain logic, so it can't drift from the data. One module in `web` owns the network, so that boundary is enforced and not just agreed.

## Architecture

```
page (Server Component)  ──▶  /api/*  route handler
                                 │
                                 ├──▶  lib/upstream  ──fetch──▶  private-alpha.github.io
                                 └──▶  packages/core
```

The feeds are `funds.json`, `companies.json` and `kpis.json` under `https://private-alpha.github.io/takehome-seed-data/api/`.

`lib/upstream` owns the URLs, timeouts, caching and validation. `packages/core` takes arrays and returns arrays. `buildPortfolio` is one pure call and the handlers only select from its result, so I never implemented a growth rate twice.

## API

| Endpoint                        | Responds with                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `GET /api/funds`                | `{ funds: FundSummary[], dataQuality: DataQualityReport }`                           |
| `GET /api/funds/:fundId`        | `{ fund: FundSummary, companies: CompanySummary[], timeseries: FundQuarterPoint[] }` |
| `GET /api/companies/:companyId` | `{ company: CompanySummary, series: CompanyQuarterPoint[] }`                         |

Errors answer as `{ error: { code, message } }`: `404 not_found`, or `502 upstream_unavailable` when the vendor answers badly, slowly, or not at all.

The pages call these endpoints over HTTP instead of importing the loader directly, so the API layer is load-bearing and not decorative. An unknown fund id renders the 404 page, and so does a company that exists but belongs to a different fund than the URL claims.

`/api/funds` returns each fund's aggregated twelve-quarter series and the names of its companies, about 10 kB, but none of the 269 raw KPI rows behind them. A card draws a sparkline and lists its holdings; it never needs a company's quarterly filings, which is what the detail endpoints are for. `dataQuality` rides along because a pipeline that silently drops rows looks exactly like one with a bug.

## Data assumptions

The feeds are inconsistent, and summing them naively produces numbers a manager would act on and regret. I measured a defect behind every rule below.

**R1 — duplicate `(companyId, quarter)` keys resolve to the last row.** `co-014`/`2023-Q2` and `co-023`/`2025-Q1` each appear twice with conflicting figures, both sitting at the very end of an otherwise grouped and sorted array. I read that as an append-only correction, so the later row wins.

**R2 — rows for unknown companies are dropped, and counted.** `co-999` and `co-998` belong to no fund. Keeping them would leak revenue no fund could account for, so I send the count to the API response instead of letting it vanish.

**R3 — every company sits on the same quarter grid (`2023-Q1`–`2025-Q4`), and a gap stays `null`.** `co-004`, `co-008` and `co-016` are missing quarters mid-history, `co-008` all of 2024. Never `0`, never interpolated. Once a fabricated financial figure is in the data you can't tell it from a real one.

**R4 — a quarterly total travels with the companies behind it, by name.** `reporting` lists the companies that filed a revenue figure and `reportingCompanies` is its length, so the count and the names can't drift apart. That test is stricter than "sent us a row": in `fund-003`/`2024-Q3` four of five filed, but `co-009` filed a null revenue, so the total rests on three. I measured the two definitions against each other and they disagree in 27% of fund-quarters, which is why the rail and the badge both read from one list.

**R5 — growth is like-for-like: a company counts only if it reported in both quarters, in the numerator and in the base.** `fund-003`, naive against like-for-like:

| Quarter | Naive QoQ | Like-for-like | Coverage |
| ------- | --------- | ------------- | -------- |
| 2023-Q2 | +60.0%    | **+9.4%**     | 5/5      |
| 2024-Q1 | −9.8%     | **+11.5%**    | 4/5      |
| 2024-Q3 | −35.7%    | **+8.2%**     | 3/5      |
| 2024-Q4 | +88.8%    | **+9.0%**     | 4/5      |
| 2025-Q3 | −30.6%    | **+8.5%**     | 4/5      |
| 2025-Q4 | +69.5%    | **+9.1%**     | 5/5      |

The fund grows at a steady 8–11% a quarter. The naive column swings between −36% and +89% and describes nothing but who happened to file that quarter. Fund EBITDA margin uses the same intersection, so the ratio never divides one set of companies by another.

**R6 — valuation is the last reported figure, carried forward, labelled "as of".** Only 96 of 269 rows carry one, because a valuation comes from a pricing event and not from the calendar.

**R7 — negative EBITDA is valid; a margin needs positive revenue underneath it.** 113 of the 244 non-null EBITDA figures are negative, down to −55.0M. That's an ordinary growth portfolio, so I filter nothing on sign.

**R8 — the million-dollar unit converts at the boundary.** `targetSizeMillionsUsd` is the only figure quoted in millions, so it's converted once, where the upstream shape becomes the domain shape.

**R9 — a company with no KPIs is still a company.** `co-021` renders as "not reporting", never as zero. Growth is `null` when either endpoint is missing, which is why `co-008` has no year-on-year figure: its base quarter sits inside its 2024 gap.

## Decisions & trade-offs

- **`server-only` on `lib/env` and `lib/upstream`.** A Client Component that imports either breaks the build instead of shipping the config to the browser. I checked the production build: the vendor host appears zero times in the client bundle.
- **`packages/core` gets no such guard.** That's the trade-off half. Tying it to a Next-specific package would cost the framework independence and the network-free tests it exists for.
- **One token scale, not two.** Colour, spacing, radius, type and motion live in one file, and the Radix primitives read the same variables. Two scales are how an interface ends up looking assembled.
- **Radix rather than shadcn/ui, and so no Tailwind.** shadcn _is_ Radix wrapped in Tailwind classes. Taking Radix directly gives the same listbox, keyboard handling and ARIA, and the app keeps one styling system.
- **Filtering and sorting live in the URL, not in component state.** The controls are the only `'use client'` in the app. Component state would have pulled every card, figure and sparkline into the client bundle to save one round trip, and a filtered view wouldn't survive a refresh or a paste into Slack.
- **The sparkline is hand-written SVG, not a chart library.** Recharts requires `'use client'`, which would turn the fund card and every number on it into client JavaScript. Recharts earns its place on the detail pages, where there are axes, tooltips and two series.
- **The company table stays a table at every width.** Cards would break the column alignment that "which company is dragging the fund down" depends on, and would mean a second markup tree rebuilding `<caption>` and `<th scope>` without offering navigation by column. I paid the narrow-screen cost with a sticky first column and a focusable scroll region.
- **One chart component serves both drill-downs.** It takes `{ quarter, revenue, ebitda }`, which a fund point and a company point both satisfy, so the Recharts markup and its text equivalent exist once.
- **A control is named by what it shows, not by a nicer sentence.** The rail's buttons used to carry `aria-label="Which companies reported in 2024-Q3"`, which reads better and quietly hides the `4/5` a sighted user can see. Anyone driving the page by voice would then be saying words that aren't on screen. The visible text is the name now, with "companies reported" appended for a screen reader, and Radix's `aria-haspopup` is what says a panel opens.
- **The coverage rail opens on hover, focus and tap.** Naming the companies behind a quarter is the point of R4, so it's content and not decoration, and content behind a hover doesn't exist for a keyboard or a phone. The cost is that the rail is a client component, though the overview page stays entirely server-rendered.
- **The upstream is untrusted input.** Zod at the boundary and `AbortSignal.timeout()` on every call, so a schema break is a handled `502` and not an `undefined.map()` five layers deeper.
- **Errors say only what the reader can act on.** The vendor's URL, status and stack trace go to the server log. The 404 doesn't echo back the id it was asked for, and `error.tsx` never renders `error.message`. It prints Next's `digest`, an opaque id that matches a screenshot to a log line.
- **A missing fund shows the 404 page but answers `200`, and this one bothers me.** The page routes are dynamic, so Next commits the status line and starts streaming before the fetch that decides whether the fund exists has returned. `notFound()` can then only replace the body. I confirmed it on the production build, and confirmed it was already true before I added `loading.tsx`. Fixing it means `generateStaticParams` with `dynamicParams: false`, which freezes the valid ids at build time, and I wasn't willing to trade a live feed for a status line. `/api/funds/:id` answers a real `404`.
- **No `global-error.tsx`.** It fires only when the root layout itself throws, and that layout loads a font and renders a link. Writing one means a second `<html>` and `<body>` that drift from the real layout over time.
- **No format check on `:fundId` and `:companyId`.** The parameter never reaches a filesystem or an outbound URL, and a regex would reject a valid id the day the vendor ships `fund-A1`. The lookup is the validation.
- **Freshness is configured once.** `next: { revalidate }` on the fetch plus a matching `Cache-Control` header. No per-route `revalidate` export, which has to be a static literal and so couldn't follow the env value.
- **Deliberately absent:** rate limiting, auth, CSRF tokens, secret rotation. Public read-only data, no session, no mutation.

## Testing

The risk is in the transformation, not the rendering. A misplaced margin is visible the moment the page loads. A fund KPI aggregated over the wrong set of companies looks perfectly reasonable and is wrong by tens of millions. No test touches the network.

**Domain — 35 tests**, over frozen and complete copies of the real feeds. Complete and not trimmed, because hand-picking rows is how a fixture quietly stops resembling its source. I picked cases where passing can't be a coincidence:

- `co-014` is restated upwards and `co-023` downwards, which separates "last wins" from "largest wins"
- `co-009`'s null revenue has to count as having filed, but not towards coverage
- like-for-like growth is asserted against sums I worked out by hand

I mutation-checked both headline rules: inverting coverage fails two tests, removing the like-for-like filter fails three.

**API — 19 tests**, against a stubbed vendor. The arithmetic is already proved. What isn't proved here is the contract. A `500`, a schema break and a silent hang all become the same `502`, and two tests pin down what that response may contain: the body must not hold the vendor's host, status or a stack frame, while the log must hold all three.

**Presentation and page logic — 50 tests.** The pure parts carry the weight: sparkline geometry, where a gap ends one run and starts another; formatting, where absolute USD reads back as `$102.0M` and a missing figure as an em dash; and filtering, sorting and the portfolio headline, whose sort fails two tests when I mutate it away.

I query components by role and not by test id, so a test fails when the markup stops being a real table, when a `<label>` comes loose from its combobox, or when growth stops being announced in words as well as by colour and a glyph. `axe-core` runs over the rendered card and table. Colour contrast needs a real canvas, so I computed those ratios separately.

Three assertions are there because the alternative is a silent lie:

- the chart is tested through its text equivalent and not its paths. The spoken description is a pure function I assert directly, and the hidden table has to carry every figure, including an em dash where the drawing simply breaks
- the valuation list must hold only the quarters an event happened in, so a carried-forward figure can't become a staircase
- the error boundary is handed a realistic upstream failure, host and IP included, and asserted to print no part of it. Rendering `error.message` fails that test

I removed six tests rather than adding them, because none of them could fail against a broken implementation.

**Not covered, deliberately.** No assertions on the SVG the chart library emits, and no end-to-end suite. Rendering defects do announce themselves on load, which is the principled reason. The honest one is that Playwright setup and flakiness would have cost most of a day I didn't have.
