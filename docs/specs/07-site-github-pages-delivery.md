# 07 – Site delivery on GitHub Pages

> **Status: Proposed.**



## 0. Status

Build status as of 2026-10-20, `main` @ `9a353ee`. Legend in the [index](./README.md#status-system).

**0 built · 2 partial · 4 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| P-1 | Deploy with GitHub Actions after site changes | Agreed | ❌ Not built | Manual `yarn gh:deploy` pushes the `gh-pages` branch |
| P-2 | Site builds from the workspace catalog | Proposed | ❌ Not built | Site uses the published npm version |
| P-3 | Configurable base path | Proposed | 🟡 Partial | Base path works but is hard-coded in `next.config.js` |
| P-4 | Static hosting constraints | Proposed | 🟡 Partial | Static export, unoptimized images, `.nojekyll` in place; no custom 404 |
| P-5 | PR previews | TBD | ❌ Not built | None (TBD-P4) |
| P-6 | Publish API docs with the site | Proposed | ❌ Not built | No API docs generated |

## 1. Why this spec exists

Goal **G2**: the site must **keep being served from GitHub Pages**. Pages is free, needs no server, and fits the project well: the data is static and bundled, so the whole site can be pre-rendered (`ARCHITECTURE.md` §5.2). This spec keeps that hosting choice and makes the deploy **automatic and safe**: every merge to `main` updates the site, and nothing broken gets published.

## 2. What exists today

| Item | Current state | Reference |
|---|---|---|
| Rendering | Next.js `output: 'export'` → static `out/` | `server/next.config.js` |
| Base path | `basePath` and `assetPrefix` = `/yugioh-fb-catalog` in production | `server/next.config.js` |
| Images | `images.unoptimized: true` (no image server on Pages) | `server/next.config.js` |
| Jekyll | `touch out/.nojekyll` so `_next/` is served | `server/package.json` `gh:theme` |
| Deploy | Manual: `yarn gh:deploy` = `next build` → `.nojekyll` → `gh-pages -d out` (pushes to the `gh-pages` branch) from a dev machine | `server/package.json` |
| Data source | The **published npm** catalog version (`^0.1.1`) | `server/package.json` |
| URL | `https://mhsalves.github.io/yugioh-fb-catalog` | `README.md` |

The table describes **today's** Next.js setup. The future stack is open ([06](./06-site-ux-forbidden-memories.md) U-4, TBD-U1). This spec is written so it applies to any static-site stack.

**Why it is like this:** static export is the only Next.js mode Pages can host. The base path is required because Pages serves project sites under `/<repo>/`. The Express server was removed in `2e50981` because it was not needed.

## 3. Gaps

| # | Gap |
|---|---|
| P-gap-1 | Deploys are manual and depend on the local machine's state (uncommitted files, a stale `node_modules`). |
| P-gap-2 | No check before deploy. A broken build could still be pushed if it was built locally with errors ignored. |
| P-gap-3 | The site shows the **published** catalog, so data merged on `main` is not live until someone publishes to npm and bumps the dependency. |
| P-gap-4 | No preview of a PR's site changes. |
| P-gap-5 | The base path is hard-coded. A custom domain or fork would need code edits. |
| P-gap-6 | No 404 page for unknown routes (Pages serves its default 404). |

## 4. Proposed improvements

### P-1 Deploy with GitHub Actions after site changes (`.github/workflows/pages.yml`) · ❌ Not built
**Rule (Agreed, 2026-10-20):** after a merge to `main`, if the merge **updates the site**, the GitHub Pages deploy runs automatically. Merges that do not affect what the site shows deploy nothing. The npm release has its own rule ([05](./05-catalog-npm-distribution.md) N-2), and the [index](./README.md#automation-rules) summarizes both.

**What counts as "a site update"** (path filter):

| Triggers a deploy | Why |
|---|---|
| `server/**` (or the future site folder, TBD-R1), except `*.md` | The site itself changed |
| `catalog/data/**`, `catalog/src/**`, `catalog/schema/**` | The site is built from the workspace catalog (P-2), so new data must appear on the site too. Removed if TBD-P2 picks "released data only" (see below) |
| `.github/workflows/pages.yml` | The deploy process changed |

Docs-only, test-only and other CI changes do not deploy.

Use the official Pages flow instead of pushing a `gh-pages` branch:

```yaml
on:
  push:
    branches: [main]
    paths:
      - "server/**"
      - "!server/**/*.md"
      - "catalog/data/**"
      - "catalog/src/**"
      - "catalog/schema/**"
      - ".github/workflows/pages.yml"
  workflow_dispatch:            # manual redeploy
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    steps:
      - checkout, setup-node (cache), install
      - test + validate data          # same as CI (01 R-4)
      - build catalog (workspace)     # 01 R-1
      - build site  → <site>/<output dir>     # e.g. server/out for today's Next.js export
      - touch <output dir>/.nojekyll          # needed when the output has _-prefixed folders (e.g. Next.js _next/)
      - actions/upload-pages-artifact (path: <output dir>)
  deploy:
    needs: build
    uses: actions/deploy-pages
```

- `cancel-in-progress: true` is safe here. A newer merge replaces an older deploy in progress, so the site always ends on the latest `main`.
- **If TBD-P2 picks "released data only":** remove the `catalog/**` paths and add `workflow_run: { workflows: [release], types: [completed] }` (deploy only if the release succeeded). The site then redeploys after each npm publish, and builds against the published package instead of the workspace.
- Repository setting: Pages source = **GitHub Actions** (a one-time manual change, **TBD-P1**).
- Remove `gh-pages` from devDependencies and the `gh:*` scripts once this works. Keep the old branch until the first successful Actions deploy, then delete it.

### P-2 Site builds from the **workspace** catalog · ❌ Not built
With workspaces ([01](./01-repository-and-workspaces.md) R-1), the site is built from the catalog source on `main`. Merged data goes live on the next deploy, with no npm publish needed (fixes P-gap-3). npm publishing ([05](./05-catalog-npm-distribution.md)) stays independent: the site may be ahead of the latest npm release. **TBD-P2:** is that acceptable, or should the site show only released data?

### P-3 Configurable base path · 🟡 Partial
The base path is read from one environment variable (for example `SITE_BASE_PATH`), defaulting to `/yugioh-fb-catalog` in production and `''` in development. The workflow sets it from `actions/configure-pages` (`steps.pages.outputs.base_path`). Forks and a future custom domain then work without code edits (TBD-P3).

How it is wired depends on the stack ([06](./06-site-ux-forbidden-memories.md) U-4). With today's Next.js it means `basePath`/`assetPrefix` in `next.config.js`; Astro uses `base`, Vite uses `base`, and SvelteKit uses `paths.base`.

### P-4 Static hosting constraints (guardrails for 06, any stack) · 🟡 Partial
Whatever stack is chosen (TBD-U1), every page in [06](./06-site-ux-forbidden-memories.md) must respect:
- **no server at runtime**: no API routes, middleware, server-side rendering per request, or incremental regeneration (in Next.js terms: no `getServerSideProps`, ISR or route handlers);
- dynamic routes (`/cards/[id]`) list all their paths at build time;
- client-side search only (the dataset is in the bundle);
- every internal link and asset goes through the base path, using the framework's link and asset helpers, never hard-coded `"/..."` URLs;
- no image optimization that needs a server (in Next.js: `images.unoptimized: true`);
- a custom 404 page emitted as `404.html` at the output root, which Pages serves for unknown paths (fixes P-gap-6).

### P-5 PR previews (optional) · ❌ Not built
Build the site on every PR (already in CI, 01 R-4) and upload the output folder as a workflow artifact. A hosted per-PR preview (for example, Netlify or Cloudflare Pages) would be an extra service outside GitHub Pages. **TBD-P4**

### P-6 Publish API docs with the site · ❌ Not built
Put the TypeDoc output ([04](./04-catalog-query-api.md) Q-8) in `<output dir>/docs/api/` during the Pages build, so docs and site deploy together.

## 5. Acceptance criteria

- [ ] Merging to `main` a PR that changes the site (or catalog data, while P-2 applies) deploys the site with no manual step, and a failing test blocks the deploy.
- [ ] Merging a PR that changes only docs or tests does not deploy.
- [ ] `https://mhsalves.github.io/yugioh-fb-catalog/` and `/cards/425` load with no 404s on assets.
- [ ] Unknown URLs show the project's own 404 page.
- [ ] `gh-pages` package and `gh:*` scripts removed.
- [ ] The base path can be overridden by an environment variable.

## 6. TBD / open questions

- **TBD-P1:** Switch the repository's Pages source to "GitHub Actions" (needs repository admin; one-time).
- **TBD-P2:** Should the site show `main` data (ahead of npm) or only released data?
- **TBD-P3:** Custom domain? If so, add a `CNAME` and set `basePath` to `''`.
- **TBD-P4:** Are PR previews needed, and is a non-GitHub host acceptable for them?
