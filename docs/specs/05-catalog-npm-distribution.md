# 05 – Catalog distribution on the npm registry

> **Status: In progress.** Release automation (N-2, N-3, N-7) is built; it publishes once the N-2b one-time setup is done.






## 0. Status

Build status as of 2026-10-20, after the release automation PR (based on `main` @ `c6a2ce9`). Legend in the [index](./README.md#status-system).

**2 built · 6 partial · 1 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| N-1 | Dual ESM + CJS build with `exports` map | Proposed | 🟡 Partial | CJS + `.d.ts` only; no ESM, `exports` or `files` allowlist |
| N-2 | Automated release after `main` merge | Agreed | 🟡 Partial | `release.yml` and the `release-check` job in `ci.yml` are built; the first automated publish waits for the N-2b setup |
| N-2b | npm authentication: trusted publishing | Agreed | 🟡 Partial | `release.yml` publishes with OIDC and no token (npm 11.21.0 pinned, environment `npm`). The npmjs.com and GitHub settings are not done yet |
| N-2a | Release order with the site | Proposed | ✅ Built | `release.yml` and `pages.yml` both start on the merge and run in parallel |
| N-3 | Versioning policy and changelog format | Proposed | ✅ Built | Policy and changelog format written below; `release-check` enforces the bump, the entry and the BREAKING rule |
| N-4 | Package README | Proposed | 🟡 Partial | `catalog/README.md` exists but documents the wrong API |
| N-5 | Pack check in CI | Proposed | 🟡 Partial | `ci.yml` installs the packed tarball and checks `require` and `import` with `getCard(425)`; no type check, `publint` or attw yet |
| N-6 | Size budget | Proposed | ❌ Not built | Not tracked |
| N-7 | Also publish to GitHub Packages | Agreed | 🟡 Partial | `release.yml` publishes the same build to `npm.pkg.github.com`; not run yet |

## 1. Why this spec exists

Goal **G4**: the catalog must **stay published on the npm registry** as `@mhsalves/yugioh-fb-catalog`. npm is how third-party apps (and today, the site) get the data. For that to be dependable, a release must be:

- **reproducible**: built by CI, not from whatever is on a laptop;
- **correctly versioned**: consumers on `^0.x` must not get surprise breaking changes;
- **usable everywhere**: CommonJS, ESM, bundlers, TypeScript, and, if the data is in JSON ([03](./03-catalog-data-authoring.md)), non-JS tools.

## 2. What exists today

| Item | Current state | Reference |
|---|---|---|
| Name and version | `@mhsalves/yugioh-fb-catalog@0.1.1` (published: `0.0.1-alpha6`, `0.1.0`, `0.1.1`) | `catalog/package.json`, `npm view` |
| Build | `tsc` → `lib/`, CommonJS, ES2016, `.d.ts` | `catalog/tsconfig.json` |
| Entry | `"main": "./lib/index.js"`. No `exports` map, no `types` field (resolved implicitly next to `main`) | `catalog/package.json` |
| Contents | Controlled by `catalog/.npmignore`, a copy of `.gitignore` that also excludes `src/` and `tsconfig.json` | `catalog/.npmignore` |
| Release | `release.yml` after a merge that changes the catalog: npm (trusted publishing) + GitHub Packages + tag `catalog-v<version>` + GitHub Release. `npm:publish` is removed | `.github/workflows/release.yml` |
| Release gate | `release-check` job in `ci.yml` on every PR | `scripts/check-catalog-release.mjs` |
| Changelog | `catalog/CHANGELOG.md`, shipped in the package | `catalog/CHANGELOG.md` |

**Why it is like this** (`ARCHITECTURE.md` §4.5): CommonJS/ES2016 gives the widest compatibility with no setup, and manual publishing was enough for a few releases.

## 3. Gaps

| # | Gap |
|---|---|
| N-gap-1 | Manual publishing: no CI gate, no provenance, and the risk of publishing an unbuilt or stale `lib/`. |
| N-gap-2 | No ESM build and no `exports` map. Modern bundlers cannot tree-shake, and `import` in Node ESM goes through CJS interop. |
| N-gap-3 | `.npmignore` is a denylist, so any new file type at the package root may leak into the package. |
| N-gap-4 | No changelog or release notes, so consumers cannot see what changed between versions. |
| N-gap-5 | No versioning policy for data changes versus API changes. |
| N-gap-6 | The package has no `README.md` of its own on npm that matches the real API. |

## 4. Proposed improvements

### N-1 Dual ESM + CJS build with an `exports` map · 🟡 Partial
Build with `tsup` (or two `tsc` configs):

```jsonc
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".":        { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./data/*": "./data/*",          // raw JSON for non-JS / advanced consumers (if 03 picks JSON)
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist", "data", "schema", "README.md", "LICENSE"]
}
```

- Use a **`files` allowlist** instead of `.npmignore` (fixes N-gap-3), and delete `catalog/.npmignore`.
- Target ES2020 or later (TBD-N2). Nothing in the data needs ES2016.

### N-2 Automated release after `main` merge (`.github/workflows/release.yml`) · 🟡 Partial
**Rule (Agreed, 2026-10-20):** after a merge to `main`, if the merge brings a **new feature or new/changed data into the catalog**, the npm release runs automatically. Merges that do not touch the catalog's code or data publish nothing. The site has its own rule ([07](./07-site-github-pages-delivery.md) P-1), and the [index](./README.md#automation-rules) summarizes both.

**What counts as "a catalog change"** (path filter):

| Triggers a release | Does not trigger a release |
|---|---|
| `catalog/data/**` (cards, relations, rules) | `catalog/**/*.md` (README, contributing guide; see TBD-N7) |
| `catalog/src/**` (query API, loader) | `catalog/**/*.test.ts`, test fixtures |
| `catalog/schema/**` | `docs/**`, `mkt_site/**` (the site, [01](./01-repository-and-workspaces.md) R-6), `.github/**` |
| `catalog/package.json` (version, dependencies, exports) | Lockfile-only changes (dev-dependency bumps from Dependabot) |

**Mechanism: version in the PR, publish on merge** *(recommended)*. Two workflows:

1. **PR check** (a job in `ci.yml`, [01](./01-repository-and-workspaces.md) R-4). If the PR changes any path in the "triggers" column:
   - `catalog/package.json` `version` must be **higher than the latest version on npm**, following the N-3 policy (data → patch, feature → minor);
   - `catalog/CHANGELOG.md` must have an entry for that version.

   The check fails with a clear message ("catalog data changed: bump the version, e.g. 0.1.1 → 0.1.2"). It is a **required status check** on `main` (branch protection, see N-2b setup).

2. **Release** (`.github/workflows/release.yml`):

```yaml
on:
  push:
    branches: [main]
    paths:
      - "catalog/data/**"
      - "catalog/src/**"
      - "catalog/schema/**"
      - "catalog/package.json"
  workflow_dispatch:            # manual re-run if a publish failed
permissions: { contents: write, id-token: write }   # tag + release; OIDC token for trusted publishing (N-2b)
concurrency: { group: npm-release, cancel-in-progress: false }   # never cancel a publish halfway
jobs:
  release:
    steps:
      - checkout, setup-node (registry-url: https://registry.npmjs.org), install
      - validate data + test + build catalog          # same gates as CI
      - read version from catalog/package.json
      - if that version already exists on npm → stop (no-op, job succeeds)
      - npm publish --access public                    # from catalog/, authenticated by trusted publishing (N-2b), no token
      - git tag catalog-v<version> && push tag
      - create GitHub Release from the CHANGELOG entry
```

Why this mechanism:
- **One merge = one release.** Nothing else to merge, which matches the rule.
- **No bot commits to `main`.** The version bump is reviewed in the PR like any other change.
- **Safe to re-run.** "Already on npm" is a no-op, so a duplicate trigger or a manual dispatch cannot publish twice.
- **Data and feature releases stay distinguishable**, through the patch/minor bump (N-3) and the changelog entry.

**As built:**
- The PR check is the `release-check` job in `ci.yml`, running `node scripts/check-catalog-release.mjs check <base sha>`. It compares the PR with its base. `catalog/package.json` counts as a catalog change only when a field consumers see changes. `devDependencies` and `scripts` are ignored, except the install hooks (`preinstall`, `install`, `postinstall`), so Dependabot dev-dependency bumps need no release. The version must be higher than **both** the base branch's version and the latest on npm.
- `release.yml` follows the sketch above. The tag and GitHub Release are created with `gh release create catalog-v<version> --target <merge sha>`, with the CHANGELOG entry as the body (`check-catalog-release.mjs notes <version>`). Each publish target and the GitHub Release are checked separately, so a re-run completes a release that stopped halfway.
- **Still open:** making `release-check` a required status check (branch protection, N-2b step 4), and the first real run.

Alternatives considered:

| Alternative | Why not the default |
|---|---|
| **Changesets** | Merging a PR opens a second "Version Packages" PR, and **publishing happens only when that second PR is merged**. That is not "after the main merge" |
| **semantic-release** (version from commit messages) | Fully automatic, but needs strict commit-message discipline, and the release bot pushes a version commit to `main` |
| Publish on a `v*` tag push | Needs a manual tag after each merge |

### N-2b npm authentication: trusted publishing · 🟡 Partial
**Agreed (2026-10-20):** `release.yml` publishes to npm with **npm trusted publishing (OIDC)**. No npm token is stored anywhere.

How it works: when the workflow runs, GitHub Actions issues a short-lived OIDC identity token (that is why the job has `id-token: write`). npm checks that the token comes from **this repository and this workflow file**, and only then accepts the publish. npm also attaches **provenance** automatically, so every version on npmjs.com links back to the exact commit and workflow run that built it.

Why trusted publishing rather than an `NPM_TOKEN` secret:
- **Nothing to leak or rotate.** There is no long-lived token in the repository secrets.
- **Only the reviewed workflow can publish.** A token can be used from anywhere; trusted publishing is bound to `mhsalves/yugioh-fb-catalog` + `release.yml`. Combined with SHA-pinned actions ([01](./01-repository-and-workspaces.md) R-4), this makes the publish path tamper-resistant.
- **Provenance for free.** No `--provenance` flag is needed.

Requirements for the workflow:
- Runs on a **GitHub-hosted runner** (trusted publishing does not support self-hosted runners).
- Uses an **npm CLI version that supports trusted publishing** (11.5.1 or later), so the job installs or pins a recent npm (TBD-N8).
- `permissions: { id-token: write, contents: write }` on the release job only.
- No `NODE_AUTH_TOKEN` / `NPM_TOKEN` environment variable.

One-time setup (needs npm package owner + repository admin):

| # | Where | Step |
|---|---|---|
| 1 | npmjs.com → `@mhsalves/yugioh-fb-catalog` → Settings → **Trusted publishing** | Add a GitHub Actions publisher: owner `mhsalves`, repository `yugioh-fb-catalog`, workflow `release.yml`, environment `npm` (optional, TBD-N9) |
| 2 | npmjs.com → package Settings → Publishing access | After the first successful trusted publish, set **"Require two-factor authentication and disallow tokens"**, so the package can only be published through the trusted workflow |
| 3 | npmjs.com → account → Access tokens | Revoke any existing automation/publish tokens used for manual publishing |
| 4 | GitHub → Settings → Branches | Protect `main`: require PRs and require the `ci.yml` check (including the version-bump check) to pass |
| 5 | GitHub → Settings → Environments (if TBD-N9 = yes) | Create environment `npm`, limited to the `main` branch |

**As built:** `release.yml` has the workflow side: a GitHub-hosted runner, `id-token: write` on the release job only, no npm token, `npm install -g npm@11.21.0` (TBD-N8), and `environment: npm` (TBD-N9). Steps 1–5 above are settings on npmjs.com and GitHub and are **not done yet**. Until step 1 is done, the release job fails at "Publish to npm"; after it, re-run the workflow (`workflow_dispatch`).

### N-2a Release order with the site · ✅ Built
The site is built from the workspace catalog ([07](./07-site-github-pages-delivery.md) P-2). The two workflows therefore do not depend on each other: a merge that changes catalog data starts **both** the npm release and the Pages deploy, in parallel. If TBD-P2 decides the site must show only released data, the Pages workflow instead starts with `workflow_run` **after** `release.yml` succeeds (see 07 P-1).

### N-3 Versioning policy and changelog format · ✅ Built
While the package is `0.x`:

| Change | Bump |
|---|---|
| Data added or corrected (new cards, fixed stats) | **patch** |
| New API function, new optional field, new collection | **minor** |
| Field renamed or removed, shape change ([02](./02-catalog-data-model.md) D-2), function removed | **minor**, with a "BREAKING" note (0.x semver) |

From `1.0.0`, standard semver applies: a breaking change is a **major**. Release `1.0.0` when the model in 02 is agreed and the card list is complete (**TBD-N3**).

**Changelog format** (`catalog/CHANGELOG.md`, shipped in the package). This is how a release says whether it breaks consumers:

- One `## <version>` heading per released version, newest first. The heading is the bare version (`## 0.4.0`), with no `v` prefix and no date.
- Under it, `###` sections, in this order, each only when it has entries: **`### BREAKING`**, `### Added`, `### Changed`, `### Fixed`, `### Removed`.
- **A release is breaking if and only if its entry has a `### BREAKING` section.** Each breaking item says what changed and how to migrate (old → new), with a code example when the shape changed (see the `0.2.0` entry).
- Commit-message markers such as `feat(catalog)!:` are welcome but **not** used to decide: the changelog is the single source, because it is reviewed in the PR and shipped to consumers.

**Enforced by the PR check** (`release-check`, N-2) on every PR that changes the catalog:

| Rule | Fails with |
|---|---|
| Version higher than the base branch and npm | "bump the version … (data → patch …; feature → minor …)" |
| A `## <version>` entry exists in `catalog/CHANGELOG.md` | "catalog/CHANGELOG.md has no "## 0.x.y" entry" |
| An entry with `### BREAKING` is at least a **minor** bump in `0.x` (a **major** from `1.0.0`) | "The 0.x.y entry has a BREAKING section, so it needs a minor bump …" |

The check cannot tell data from features, so patch versus minor for non-breaking changes stays a review decision.

### N-4 Package README · 🟡 Partial
`catalog/README.md` becomes the npm landing page: install, five-line usage, a link to the TypeDoc API ([04](./04-catalog-query-api.md) Q-8), a coverage badge, and a link to the site.

### N-5 Pack check in CI · 🟡 Partial
Covered by [01](./01-repository-and-workspaces.md) R-4 step 5: `npm pack`, install the tarball into a scratch project, then `require` **and** `import` it and call `getCard(425)`. Optionally add `publint` and `@arethetypeswrong/cli` to lint the package shape.

### N-6 Size budget · ❌ Not built
Track the packed size in CI. At about 722 cards plus relations, a few hundred KB is the expected ceiling (**TBD-N4**). If relations grow large, offer subpath entries (`@mhsalves/yugioh-fb-catalog/fusions`) so consumers load only what they use.

### N-7 Also publish to GitHub Packages · 🟡 Partial
**Agreed (2026-10-20, requested by the owner):** every release is also published to the **GitHub Packages npm registry** (`npm.pkg.github.com`), so the package shows under the repository's **Packages** sidebar next to the code.

- **Same build, same version.** The `release.yml` job publishes the `lib/` it just built to npmjs.com first, then to GitHub Packages. npmjs.com stays the primary registry: README install instructions and the site point there.
- **Name.** GitHub Packages requires the scope to match the owner. `@mhsalves/yugioh-fb-catalog` already does, so no rename is needed. The `repository` field in `catalog/package.json` links the package to this repository.
- **Auth.** The workflow's `GITHUB_TOKEN` with `packages: write` on the release job. It is short-lived and needs no setup or secret. Trusted publishing (N-2b) is an npmjs.com feature and does not apply here, and GitHub Packages shows no npm provenance.
- **Separate npmrc.** The step writes its own `npmrc` for `npm.pkg.github.com`, so the npmjs.com config and `catalog/package.json` stay unchanged (no `publishConfig`, which would redirect `npm publish`).
- **Safe to re-run.** If the version is already on GitHub Packages, the step skips it, the same way the npm step does.
- **Consumers** who want it from GitHub add `@mhsalves:registry=https://npm.pkg.github.com` to their `.npmrc`. GitHub Packages needs a token to install, even for public packages.

## 5. Acceptance criteria

- [x] Releases come only from CI. `npm:publish` is removed from local scripts.
- [ ] Merging a PR that changes `catalog/data/**` or `catalog/src/**` publishes the new version to npm with no manual step.
- [ ] Merging a PR that changes only docs, the site or CI publishes nothing.
- [x] A PR that changes catalog code or data without a version bump fails CI (`release-check`; still to be made a required check).
- [x] A PR whose CHANGELOG entry has `### BREAKING` with only a patch bump fails CI (N-3).
- [ ] Re-running the release workflow for a version that is already published succeeds as a no-op.
- [ ] `import { getCard } from "@mhsalves/yugioh-fb-catalog"` and `require(...)` both work, with types.
- [ ] `npm pack --dry-run` lists only `dist/`, `data/`, `schema/`, `README.md`, `LICENSE`, `package.json`.
- [ ] Every published version has a `CHANGELOG.md` entry.
- [ ] Each published version shows npm provenance.
- [ ] Publishing uses trusted publishing: the repository has no `NPM_TOKEN` secret, and the package is set to disallow token publishing.
- [ ] Each published version also appears under the repository's Packages (GitHub Packages, N-7), with the same version as npm.

## 6. TBD / open questions

- ~~**TBD-N1:** Release trigger and mechanism.~~ **Resolved (2026-10-20):** an automatic release after a `main` merge that changes the catalog (rule agreed). The mechanism proposed is "version in PR, publish on merge" (N-2).
- ~~**TBD-N6:** npm auth.~~ **Resolved (2026-10-20): npm trusted publishing (OIDC)**, with no `NPM_TOKEN` (N-2b). The one-time setup steps are listed in N-2b.
- ~~**TBD-N8:** How the release job gets a trusted-publishing-capable npm.~~ **Built with a default (2026-10-20):** `npm install -g npm@11.21.0` in the job, keeping Node 22 from `.nvmrc`. Bump the pin by hand; Dependabot does not track it.
- ~~**TBD-N9:** Use a GitHub **environment** (`npm`) for the release job?~~ **Built with the proposal (2026-10-20):** yes, environment `npm`, without required approval. Use `npm` as the environment name when configuring the trusted publisher (N-2b step 1).
- **TBD-N7:** Should README-only changes to `catalog/` trigger a release, so the npm page updates? Proposal: no. They ship with the next release.
- **TBD-N2:** Minimum Node version and JS target (ties to TBD-R3).
- **TBD-N3:** Criteria for `1.0.0`.
- **TBD-N4:** Size budget, and whether to split relations into subpath entries.
- **TBD-N5:** Should the raw `data/*.json` be part of the public, semver-covered contract, or "use at your own risk"?
