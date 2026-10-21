# 01 – Repository, workspaces, tests and CI

> **Status: Built.** Foundation for every other spec.

## 0. Status

Build status as of 2026-10-20, after the spec 01 build PR (based on `main` @ `750004a`); R-4 rechecked after the release automation PR (based on `main` @ `c6a2ce9`). Legend in the [index](./README.md#status-system).

**6 built · 0 partial · 0 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| R-1 | Root workspace | Agreed | ✅ Built | Root `package.json` (Yarn 1 workspaces), one `yarn.lock`; the site uses the workspace catalog |
| R-2 | Tests with Vitest | Agreed | ✅ Built | `catalog/test/`: query API tests and data integrity checks. The optional site render test is not built |
| R-3 | Lint and format | Agreed | ✅ Built | ESLint flat config + Prettier at the root (`yarn lint`, `yarn format:check`) |
| R-4 | CI workflow on GitHub Actions, actions pinned by SHA | Agreed | ✅ Built | `ci.yml` runs steps 1–7 and the SHA-pin check (step 7 is the `release-check` job, [05](./05-catalog-npm-distribution.md) N-2) |
| R-5 | Site in TypeScript `strict: true` | Agreed | ✅ Built | Both packages are `strict: true` |
| R-6 | Rename `server/` to `mkt_site/` | Agreed | ✅ Built | Site lives in `mkt_site/` (package `yugioh-fb-catalog-mkt-site`) |

## 1. Why this spec exists

The project ships **two deliverables from one repository**: the npm catalog (`catalog/`) and the GitHub Pages site (`mkt_site/`, named `server/` before R-6). Every other goal (easy data entry, a reliable npm package, an automatically deployed site) depends on:

- the site being able to use the **local** catalog while you develop, so a data change can be previewed without publishing;
- a safety net (tests + CI) that catches broken data **before** it reaches npm or the site.

Without this foundation, each data change costs a publish, a version bump and a manual deploy, and mistakes are only found in production.

## 2. What exists today

| Area | Current state | Reference |
|---|---|---|
| Layout | Yarn 1 workspace: private root `package.json` with workspaces `catalog` and `mkt_site`, **one** root `yarn.lock`. Node 22 (`.nvmrc`) | `package.json` |
| Single source of truth | Done. The stale root copy of the library was removed in `6e0f63f`. | `ARCHITECTURE.md` S1/S2 |
| Linking | `mkt_site/` depends on `"@mhsalves/yugioh-fb-catalog": "*"`, which Yarn links to `catalog/`. `yarn dev` builds the catalog and runs `tsc --watch` next to `next dev`, so catalog edits show up live | `mkt_site/package.json` |
| Tests | Vitest in `catalog/`: query API tests and data integrity checks (unique and sorted IDs, ID range 1–722, password format, cost, level, ritual references) | `catalog/test/` |
| Lint/format | ESLint flat config (`typescript-eslint`, `react-hooks`) and Prettier (4 spaces, 120 columns; 2 spaces for JSON/YAML; Markdown not formatted) | `eslint.config.mjs`, `.prettierrc.json` |
| CI | `ci.yml` on every PR and push to `main`. Dependabot watches the root workspace and the Actions | `.github/workflows/ci.yml`, `.github/dependabot.yml` |
| Type safety | Both `catalog/` and `mkt_site/` are `strict: true` | `*/tsconfig.json` |

**Why it was different before** *(inferred)*: the site deliberately consumed the published npm package so it doubled as a real consumer of what ships. That made sense with a few cards but did not scale once data entry started. The check now lives in CI as a packed-tarball smoke test (R-4).

The gaps below describe the state before this spec was built and are kept for history.

## 3. Gaps

- **R-gap-1:** A data change cannot be previewed on the site without publishing to npm.
- **R-gap-2:** Nothing verifies Dependabot PRs or contributor PRs. They are merged unverified.
- **R-gap-3:** No data integrity checks exist (duplicate IDs, out-of-range values, broken references).
- **R-gap-4:** Two lockfiles and two install steps mean two sets of dependency versions to keep apart.

## 4. Proposed improvements

### R-1 Root workspace · ✅ Built
A root `package.json` (private, never published), as built with Yarn 1 (TBD-R2):

```jsonc
{
  "private": true,
  "workspaces": ["catalog", "mkt_site"],
  "scripts": {
    "build": "yarn workspace @mhsalves/yugioh-fb-catalog build && yarn workspace yugioh-fb-catalog-mkt-site build",
    // builds the catalog once, then runs `tsc --watch` for it next to `next dev`
    "dev": "yarn workspace @mhsalves/yugioh-fb-catalog build && (yarn workspace @mhsalves/yugioh-fb-catalog dev & yarn workspace yugioh-fb-catalog-mkt-site dev)",
    // the site type-checks against the catalog's built lib/*.d.ts, so build it first
    "typecheck": "yarn workspace @mhsalves/yugioh-fb-catalog build && yarn workspaces run typecheck",
    "test": "yarn workspace @mhsalves/yugioh-fb-catalog test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check:action-pins": "sh scripts/check-action-pins.sh"
  },
  "resolutions": { /* security pins, moved from the site: Yarn 1 reads them only at the root */ }
}
```

- `mkt_site/` depends on `"@mhsalves/yugioh-fb-catalog": "*"` (Yarn 1), which Yarn links to `catalog/`, so local changes appear immediately.
- One lockfile at the root. It was seeded from the two old lockfiles, so the resolved versions did not change.
- The catalog builds with `catalog/tsconfig.build.json` (`src/` only). `catalog/tsconfig.json` type-checks `src/` and `test/`.
- **Trade-off:** we lose the "site tests the published package" property. That check moved to CI (R-4, a smoke test that installs the packed tarball).

### R-2 Tests with Vitest · ✅ Built
- `catalog/` has Vitest (`yarn test`), with tests for the query API ([04](./04-catalog-query-api.md)) in `catalog/test/cards.test.ts` and **data integrity checks** ([03](./03-catalog-data-authoring.md) §4) in `catalog/test/data-integrity.test.ts`: unique IDs, sorted by ID, ID in 1–722 (upper bound until TBD-D10), non-empty name, 8-digit password, cost 0–999999, level 1–12, ritual references in range. Rules for data that does not exist yet (fusions, equips, duelists) arrive with that data.
- `mkt_site/` gets a minimal render test for the main pages (optional, later). **Not built.**

### R-3 Lint and format · ✅ Built
ESLint (flat config, `typescript-eslint`, `react-hooks` for the site, `eslint-config-prettier`) plus Prettier at the root, with one shared config (`eslint.config.mjs`, `.prettierrc.json`):
- Prettier matches the existing style: 4-space indent and 120 columns for code, 2 spaces for JSON and YAML (as [03](./03-catalog-data-authoring.md) asks for data files).
- Markdown is in `.prettierignore`, so the hand-aligned spec tables are not rewritten.
- The one-time reformat is its own commit, listed in `.git-blame-ignore-revs`.

### R-4 CI workflow (`.github/workflows/ci.yml`) · ✅ Built

Built: `ci.yml` with steps 1–7 below, the SHA-pin enforcement, and Dependabot for the Actions. Step 7 is the `release-check` job ([05](./05-catalog-npm-distribution.md) N-2). Making the checks required on `main` is a branch-protection setting in the repository, not code.

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
- **Enforcement:** a CI step (`yarn check:action-pins`, `scripts/check-action-pins.sh`, a plain grep, see TBD-R6) fails if any `uses:` line in `.github/workflows/` is not pinned to a 40-character SHA. Local actions (`uses: ./...`) and `docker://` images are exempt.
- The YAML snippets in these specs write actions by name only (`actions/deploy-pages`) for readability. The real workflow files must pin them.

`ci.yml` runs on every PR and every push to `main`:

1. install (cached) ✅
2. type-check both packages ✅
3. run lint (and the Prettier check) ✅
4. run tests, including data validation ✅
5. build the catalog, `npm pack`, and install the tarball into a temporary project to smoke-test the published shape ✅
6. build the site (`vite build`, see [06](./06-site-ux-forbidden-memories.md) U-4), but do not deploy it ✅
7. on PRs that change the catalog's code or data: the version-bump and changelog check ([05](./05-catalog-npm-distribution.md) N-2, N-3), job `release-check` ✅

Node comes from `.nvmrc` (22, TBD-R3). The workflow has `permissions: contents: read`, checks out without persisted credentials, and cancels superseded runs on the same ref.

Deploy and publish workflows are specified in [07](./07-site-github-pages-delivery.md) and [05](./05-catalog-npm-distribution.md).

### R-5 Site in TypeScript `strict: true` · ✅ Built
The site uses strict TypeScript whatever its stack. On today's Vite + React site ([06](./06-site-ux-forbidden-memories.md) U-4), `mkt_site/tsconfig.json` has `strict: true` (plus `noUnusedLocals`/`noUnusedParameters`). A future stack must keep strict mode.

### R-6 Rename `server/` to `mkt_site/` · ✅ Built
**Agreed (2026-10-20):** the site folder is renamed from `server/` to **`mkt_site/`**. The folder is a static site, not a server (see `ARCHITECTURE.md` §5), so the old name was misleading.

Every spec now uses `mkt_site/`, both for the target layout and for what exists today. `server/` appears only where history is described.

What the rename touched (all in one PR):

| Place | Change |
|---|---|
| Folder | `git mv server mkt_site` (keeps history) ✅ |
| `mkt_site/package.json` | `name`: `yugioh-fb-catalog-server` → `yugioh-fb-catalog-mkt-site` (TBD-R5), now `private: true` ✅ |
| Root workspaces (R-1) | `"workspaces": ["catalog", "mkt_site"]` ✅ |
| `.github/dependabot.yml` | One `npm` entry at `directory: "/"` for the whole workspace (one root lockfile), instead of `/catalog` + `/server`. Groups: `framework`, `tooling`, `minor-and-patch` ✅ |
| Workflow path filters | `mkt_site/**` in `pages.yml` ([07](./07-site-github-pages-delivery.md) P-1) and the "does not release" list in `release.yml` ([05](./05-catalog-npm-distribution.md) N-2). Those workflows do not exist yet, so they use the new name from the start |
| Pages artifact path | `mkt_site/dist` (Vite build; was `mkt_site/out` with the Next.js export). Deployed by `pages.yml` ([07](./07-site-github-pages-delivery.md) P-1) ✅ |
| Docs | Root `README.md`, `mkt_site/README.md`, `docs/ARCHITECTURE.md`, specs ✅ |
| `.gitignore` | No `server/`-specific entries ✅ |

The published site URL does not change: it comes from the repository name (`/yugioh-fb-catalog/`), not the folder name.

## 5. Acceptance criteria

- [x] `yarn install && yarn dev` at the root starts the site using the local catalog source.
- [x] Adding a card in `catalog/` shows it on `localhost:3000` without publishing (checked: a card rename in `catalog/src` appeared on the running dev server without a restart).
- [x] Every PR shows a green or red CI check covering type-check, lint, test and build (`ci.yml`; making it a *required* check is a branch-protection setting).
- [x] One lockfile at the root.

## 6. TBD / open questions

- ~~**TBD-R1:** Rename `server/`?~~ **Resolved (2026-10-20):** rename to **`mkt_site/`** (R-6).
- **TBD-R2:** Which package manager? Yarn 1 (current), Yarn Berry, pnpm or npm. pnpm has the strictest workspace linking, and Yarn 1 needs the least churn. **Built with Yarn 1 (2026-10-20)** as the least-churn default. Switching later only touches the root `package.json`, the lockfile and CI.
- **TBD-R3:** Minimum supported Node version, both for development and for consumers of the package (affects [05](./05-catalog-npm-distribution.md)). **Development and CI use Node 22** (`.nvmrc`, 2026-10-20). Node 20 is end-of-life and Vitest 5 needs ≥ 22.12. The minimum for **package consumers** (`engines`) is still open and belongs to [05](./05-catalog-npm-distribution.md).
- ~~**TBD-R4:** Pin GitHub Actions by major version or by commit SHA?~~ **Resolved (2026-10-20): pin by full commit SHA**, with the version in a comment (R-4 conventions).
- **TBD-R5:** Package name for the site workspace: `yugioh-fb-catalog-mkt-site` (proposed), or another name? The package is private and never published, so this only affects workspace commands. **Built with `yugioh-fb-catalog-mkt-site` (2026-10-20).**
- **TBD-R6:** Tool for checking the SHA pins: a plain grep step (simplest), `actionlint`, or `zizmor` (also audits workflow security)? **Built with a plain grep** (`scripts/check-action-pins.sh`, 2026-10-20). `zizmor` stays an option when the publish and deploy workflows arrive.
