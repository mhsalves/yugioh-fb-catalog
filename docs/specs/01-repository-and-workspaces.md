# 01 – Repository, workspaces, tests and CI

> **Status: Proposed.** Foundation for every other spec.




## 0. Status

Build status as of 2026-10-20, `main` @ `9a353ee`. Legend in the [index](./README.md#status-system).

**0 built · 1 partial · 5 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| R-1 | Root workspace | Proposed | ❌ Not built | Two separate packages, no root `package.json` |
| R-2 | Tests with Vitest | Proposed | ❌ Not built | No tests |
| R-3 | Lint and format | Proposed | ❌ Not built | No linter (`tslint` removed) |
| R-4 | CI workflow on GitHub Actions | Agreed | ❌ Not built | Only Dependabot, no workflow checks PRs |
| R-5 | Site in TypeScript `strict: true` | Proposed | 🟡 Partial | `catalog/` is strict, `server/` is `strict: false` |
| R-6 | Rename `server/` to `site/` | TBD | ❌ Not built | Folder still named `server/` (TBD-R1) |

## 1. Why this spec exists

The project ships **two deliverables from one repository**: the npm catalog (`catalog/`) and the GitHub Pages site (`server/`). Every other goal (easy data entry, a reliable npm package, an automatically deployed site) depends on:

- the site being able to use the **local** catalog while you develop, so a data change can be previewed without publishing;
- a safety net (tests + CI) that catches broken data **before** it reaches npm or the site.

Without this foundation, each data change costs a publish, a version bump and a manual deploy, and mistakes are only found in production.

## 2. What exists today

| Area | Current state | Reference |
|---|---|---|
| Layout | Two independent packages, `catalog/` and `server/`, each with its own `yarn.lock`. No root `package.json`. | repo root |
| Single source of truth | Done. The stale root copy of the library was removed in `6e0f63f`. | `ARCHITECTURE.md` S1/S2 |
| Linking | `server/` installs the **published** `@mhsalves/yugioh-fb-catalog@^0.1.1` from npm | `server/package.json` |
| Tests | None | — |
| Lint/format | None (`tslint` was removed as unused/deprecated) | `6e0f63f` |
| CI | None. Only Dependabot (weekly grouped updates for `/catalog`, `/server`, and Actions) | `.github/dependabot.yml` |
| Type safety | `catalog/` is `strict: true`; `server/` is `strict: false` | `*/tsconfig.json` |

**Why it is like this** *(inferred)*: the server deliberately consumed the npm package so the site doubles as a real consumer of what ships. This made sense with a few cards, but it no longer scales once data entry starts.

## 3. Gaps

- **R-gap-1:** A data change cannot be previewed on the site without publishing to npm.
- **R-gap-2:** Nothing verifies Dependabot PRs or contributor PRs. They are merged unverified.
- **R-gap-3:** No data integrity checks exist (duplicate IDs, out-of-range values, broken references).
- **R-gap-4:** Two lockfiles and two install steps mean two sets of dependency versions to keep apart.

## 4. Proposed improvements

### R-1 Root workspace · ❌ Not built
Add a root `package.json` (private, never published):

```jsonc
{
  "private": true,
  "workspaces": ["catalog", "server"],
  "scripts": {
    "build": "yarn workspace @mhsalves/yugioh-fb-catalog build && yarn workspace yugioh-fb-catalog-server build",
    "test": "yarn workspaces foreach run test",
    "dev": "yarn workspace yugioh-fb-catalog-server dev"
  }
}
```

- `server/` depends on `"@mhsalves/yugioh-fb-catalog": "workspace:*"` (Yarn Berry/pnpm) or `"*"` (Yarn 1/npm), so local changes appear immediately.
- One lockfile at the root.
- **Trade-off:** we lose the "site tests the published package" property. That check moves to CI instead (R-4, a smoke test that installs the packed tarball).

### R-2 Tests with Vitest · ❌ Not built
- `catalog/` gets Vitest, with tests for the query API ([04](./04-catalog-query-api.md)) and **data integrity checks** ([03](./03-catalog-data-authoring.md) §4).
- `server/` gets a minimal render test for the main pages (optional, later).

### R-3 Lint and format · ❌ Not built
ESLint (flat config, `typescript-eslint`) plus Prettier at the root, with one shared config.

### R-4 CI workflow (`.github/workflows/ci.yml`) · ❌ Not built

**CI platform: GitHub Actions (Agreed, 2026-10-20).** All automation runs on GitHub Actions: CI (`ci.yml`), the npm release ([05](./05-catalog-npm-distribution.md) N-2, `release.yml`) and the Pages deploy ([07](./07-site-github-pages-delivery.md) P-1, `pages.yml`). No other CI service is used. Reasons:
- **Built in:** the repository already lives on GitHub. Checks appear on PRs and can be made required with branch protection, with no extra service to connect.
- **Free** for public repositories on standard runners.
- **Official GitHub Pages deploy** (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`). Other CI services would have to push a `gh-pages` branch instead.
- **npm trusted publishing (OIDC) and provenance** are supported from GitHub Actions, so no long-lived npm token is needed (TBD-N6).
- **Dependabot** already keeps the Actions versions up to date (`.github/dependabot.yml`).

Workflow conventions: every workflow lives in `.github/workflows/`, pins actions to a major version (or a SHA, TBD-R4), and sets the minimum `permissions` it needs.

`ci.yml` runs on every PR and every push to `main`:

1. install (cached)
2. type-check both packages
3. run lint
4. run tests, including data validation
5. build the catalog, `npm pack`, and install the tarball into a temporary project to smoke-test the published shape
6. build the site (with today's stack, `next build`), but do not deploy it
7. on PRs that change the catalog's code or data: the version-bump and changelog check ([05](./05-catalog-npm-distribution.md) N-2)

Deploy and publish workflows are specified in [07](./07-site-github-pages-delivery.md) and [05](./05-catalog-npm-distribution.md).

### R-5 Site in TypeScript `strict: true` · 🟡 Partial
Whatever site stack is chosen ([06](./06-site-ux-forbidden-memories.md) U-4, TBD-U1), the site uses strict TypeScript. On today's Next.js site, this means enabling it in `server/tsconfig.json` and fixing `index.tsx` (`_: any`). If the stack is replaced soon, do this as part of the migration instead.

### R-6 (Optional) Rename `server/` to `site/` · ❌ Not built
The folder is a static site, not a server (see `ARCHITECTURE.md` §5). Renaming it removes the confusion. **TBD-R1**

## 5. Acceptance criteria

- [ ] `yarn install && yarn dev` at the root starts the site using the local catalog source.
- [ ] Adding a card in `catalog/` shows it on `localhost:3000` without publishing.
- [ ] Every PR shows a green or red CI check covering type-check, lint, test and build.
- [ ] One lockfile at the root.

## 6. TBD / open questions

- **TBD-R1:** Rename `server/` to `site/` (or `web/`)? This affects the Pages workflow and the docs.
- **TBD-R2:** Which package manager? Yarn 1 (current), Yarn Berry, pnpm or npm. pnpm has the strictest workspace linking, and Yarn 1 needs the least churn.
- **TBD-R3:** Minimum supported Node version, both for development and for consumers of the package (affects [05](./05-catalog-npm-distribution.md)).
- **TBD-R4:** Pin GitHub Actions by major version (`actions/checkout@v4`, simpler) or by commit SHA (safer against a compromised tag; Dependabot can still update SHAs)?
