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
| R-4 | CI workflow on GitHub Actions, actions pinned by SHA | Agreed | ❌ Not built | Only Dependabot, no workflow checks PRs |
| R-5 | Site in TypeScript `strict: true` | Proposed | 🟡 Partial | `catalog/` is strict, `server/` is `strict: false` |
| R-6 | Rename `server/` to `mkt_site/` | Agreed | ❌ Not built | Folder still named `server/` |

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
  "workspaces": ["catalog", "mkt_site"],   // site folder after the R-6 rename
  "scripts": {
    "build": "yarn workspace @mhsalves/yugioh-fb-catalog build && yarn workspace yugioh-fb-catalog-mkt-site build",
    "test": "yarn workspaces foreach run test",
    "dev": "yarn workspace yugioh-fb-catalog-mkt-site dev"
  }
}
```

- `mkt_site/` depends on `"@mhsalves/yugioh-fb-catalog": "workspace:*"` (Yarn Berry/pnpm) or `"*"` (Yarn 1/npm), so local changes appear immediately.
- One lockfile at the root.
- **Trade-off:** we lose the "site tests the published package" property. That check moves to CI instead (R-4, a smoke test that installs the packed tarball).

### R-2 Tests with Vitest · ❌ Not built
- `catalog/` gets Vitest, with tests for the query API ([04](./04-catalog-query-api.md)) and **data integrity checks** ([03](./03-catalog-data-authoring.md) §4).
- `mkt_site/` gets a minimal render test for the main pages (optional, later).

### R-3 Lint and format · ❌ Not built
ESLint (flat config, `typescript-eslint`) plus Prettier at the root, with one shared config.

### R-4 CI workflow (`.github/workflows/ci.yml`) · ❌ Not built

**CI platform: GitHub Actions (Agreed, 2026-10-20).** All automation runs on GitHub Actions: CI (`ci.yml`), the npm release ([05](./05-catalog-npm-distribution.md) N-2, `release.yml`) and the Pages deploy ([07](./07-site-github-pages-delivery.md) P-1, `pages.yml`). No other CI service is used. Reasons:
- **Built in:** the repository already lives on GitHub. Checks appear on PRs and can be made required with branch protection, with no extra service to connect.
- **Free** for public repositories on standard runners.
- **Official GitHub Pages deploy** (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`). Other CI services would have to push a `gh-pages` branch instead.
- **npm trusted publishing (OIDC) and provenance** are supported from GitHub Actions, so no long-lived npm token is needed (agreed, see [05](./05-catalog-npm-distribution.md) N-2b).
- **Dependabot** already keeps the Actions versions up to date (`.github/dependabot.yml`).

Workflow conventions:
- Every workflow lives in `.github/workflows/` and sets the minimum `permissions` it needs, at the workflow or job level.
- **Every action is pinned by its full commit SHA (Agreed, 2026-10-20)**, with the version tag in a comment:

  ```yaml
  - uses: actions/checkout@<40-char commit SHA>  # v4.x.y
  ```

  A tag like `@v4` can be moved to different code, for example if the action's repository is compromised. A SHA cannot, so pinning by SHA guarantees that the workflows, and especially the ones holding `id-token: write` for npm publishing and Pages, run exactly the reviewed code.
- **Updates stay automatic:** the `github-actions` ecosystem already in `.github/dependabot.yml` opens PRs that bump both the SHA and the version comment. These PRs go through `ci.yml` like any other.
- **Enforcement:** a CI step fails if any `uses:` line in `.github/workflows/` is not pinned to a 40-character SHA (a small grep or `zizmor`/`actionlint` check, TBD-R6). Local actions (`uses: ./...`) are exempt.
- The YAML snippets in these specs write actions by name only (`actions/deploy-pages`) for readability. The real workflow files must pin them.

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

### R-6 Rename `server/` to `mkt_site/` · ❌ Not built
**Agreed (2026-10-20):** the site folder is renamed from `server/` to **`mkt_site/`**. The folder is a static site, not a server (see `ARCHITECTURE.md` §5), so the old name was misleading.

From this decision on, every spec that describes the **target** layout uses `mkt_site/`. Sections that describe **what exists today** keep `server/` until the rename is merged.

What the rename touches (all in one PR):

| Place | Change |
|---|---|
| Folder | `git mv server mkt_site` (keeps history) |
| `mkt_site/package.json` | `name`: `yugioh-fb-catalog-server` → `yugioh-fb-catalog-mkt-site` (TBD-R5) |
| Root workspaces (R-1) | `"workspaces": ["catalog", "mkt_site"]` |
| `.github/dependabot.yml` | `directory: "/server"` → `"/mkt_site"` (and the group names) |
| Workflow path filters | `server/**` → `mkt_site/**` in `pages.yml` ([07](./07-site-github-pages-delivery.md) P-1) and the "does not release" list in `release.yml` ([05](./05-catalog-npm-distribution.md) N-2) |
| Pages artifact path | `server/out` → `mkt_site/out` (with today's Next.js export) |
| Docs | Root `README.md`, `server/README.md` → `mkt_site/README.md`, `docs/ARCHITECTURE.md` |
| `.gitignore` | Check for any `server/`-specific entries |

The published site URL does not change: it comes from the repository name (`/yugioh-fb-catalog/`), not the folder name.

## 5. Acceptance criteria

- [ ] `yarn install && yarn dev` at the root starts the site using the local catalog source.
- [ ] Adding a card in `catalog/` shows it on `localhost:3000` without publishing.
- [ ] Every PR shows a green or red CI check covering type-check, lint, test and build.
- [ ] One lockfile at the root.

## 6. TBD / open questions

- ~~**TBD-R1:** Rename `server/`?~~ **Resolved (2026-10-20):** rename to **`mkt_site/`** (R-6).
- **TBD-R2:** Which package manager? Yarn 1 (current), Yarn Berry, pnpm or npm. pnpm has the strictest workspace linking, and Yarn 1 needs the least churn.
- **TBD-R3:** Minimum supported Node version, both for development and for consumers of the package (affects [05](./05-catalog-npm-distribution.md)).
- ~~**TBD-R4:** Pin GitHub Actions by major version or by commit SHA?~~ **Resolved (2026-10-20): pin by full commit SHA**, with the version in a comment (R-4 conventions).
- **TBD-R5:** Package name for the site workspace: `yugioh-fb-catalog-mkt-site` (proposed), or another name? The package is private and never published, so this only affects workspace commands.
- **TBD-R6:** Tool for checking the SHA pins: a plain grep step (simplest), `actionlint`, or `zizmor` (also audits workflow security)?
