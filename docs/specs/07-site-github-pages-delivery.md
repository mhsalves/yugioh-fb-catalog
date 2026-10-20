# 07 – Site delivery on GitHub Pages

> **Status: Proposed.**

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

### P-1 Deploy with GitHub Actions (`.github/workflows/pages.yml`)
Use the official Pages flow instead of pushing a `gh-pages` branch:

```yaml
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    steps:
      - checkout, setup-node (cache), install
      - test + validate data          # same as CI (01 R-4)
      - build catalog (workspace)     # 01 R-1
      - build site  → server/out
      - touch server/out/.nojekyll
      - actions/upload-pages-artifact (path: server/out)
  deploy:
    needs: build
    uses: actions/deploy-pages
```

- Repository setting: Pages source = **GitHub Actions** (a one-time manual change, **TBD-P1**).
- Remove `gh-pages` from devDependencies and the `gh:*` scripts once this works. Keep the old branch until the first successful Actions deploy, then delete it.

### P-2 Site builds from the **workspace** catalog
With workspaces ([01](./01-repository-and-workspaces.md) R-1), the site is built from the catalog source on `main`. Merged data goes live on the next deploy, with no npm publish needed (fixes P-gap-3). npm publishing ([05](./05-catalog-npm-distribution.md)) stays independent: the site may be ahead of the latest npm release. **TBD-P2:** is that acceptable, or should the site show only released data?

### P-3 Configurable base path
```js
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? '/yugioh-fb-catalog' : '');
```
The workflow sets it from `actions/configure-pages` (`steps.pages.outputs.base_path`). Forks and a future custom domain then work without code edits (TBD-P3).

### P-4 Static-export constraints (guardrails for 06)
Every page in [06](./06-site-ux-forbidden-memories.md) must respect:
- no API routes, no middleware, no `getServerSideProps`, no ISR;
- dynamic routes (`/cards/[id]`) must list all their paths at build time;
- client-side search only (the dataset is in the bundle);
- every internal link and asset must go through `basePath` (`next/link` and `next/image` handle this; raw `<img src="/...">` does not);
- a custom `404.tsx`, which Pages serves for unknown paths (fixes P-gap-6).

### P-5 PR previews (optional)
Build the site on every PR (already in CI, 01 R-4) and upload `out/` as a workflow artifact. A hosted per-PR preview (for example, Netlify or Cloudflare Pages) would be an extra service outside GitHub Pages. **TBD-P4**

### P-6 Publish API docs with the site
Put the TypeDoc output ([04](./04-catalog-query-api.md) Q-8) in `server/out/docs/api/` during the Pages build, so docs and site deploy together.

## 5. Acceptance criteria

- [ ] Merging to `main` deploys the site with no manual step, and a failing test blocks the deploy.
- [ ] `https://mhsalves.github.io/yugioh-fb-catalog/` and `/cards/425` load with no 404s on assets.
- [ ] Unknown URLs show the project's own 404 page.
- [ ] `gh-pages` package and `gh:*` scripts removed.
- [ ] The base path can be overridden by an environment variable.

## 6. TBD / open questions

- **TBD-P1:** Switch the repository's Pages source to "GitHub Actions" (needs repository admin; one-time).
- **TBD-P2:** Should the site show `main` data (ahead of npm) or only released data?
- **TBD-P3:** Custom domain? If so, add a `CNAME` and set `basePath` to `''`.
- **TBD-P4:** Are PR previews needed, and is a non-GitHub host acceptable for them?
