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
pnpm format        # Rewrites files with Prettier
pnpm format:check  # Verifies formatting without writing
```

## Project structure

```
apps/web/               Next.js application — route handlers and pages
  app/                  App Router: layouts, pages and the API layer
packages/core/          pure TypeScript domain — no React, no Next, no fetch,
                        which is why it tests fast and without a network
  src/schemas.ts        zod schemas for the three upstream feeds, plus the types
                        inferred from them — the only description of what the
                        vendor is allowed to send us
  src/types.ts          the domain shapes this app serves to its own frontend
  src/normalize.ts      resolves the defects in the raw KPI feed (R1, R2)
```
