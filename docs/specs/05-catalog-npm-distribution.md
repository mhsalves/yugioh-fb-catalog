# 05 – Catalog distribution on the npm registry

> **Status: Proposed.**



## 0. Status

Build status as of 2026-10-20, `main` @ `9a353ee`. Legend in the [index](./README.md#status-system).

**0 built · 2 partial · 5 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| N-1 | Dual ESM + CJS build with `exports` map | Proposed | 🟡 Partial | CJS + `.d.ts` only; no ESM, `exports` or `files` allowlist |
| N-2 | Automated release after `main` merge | Agreed | ❌ Not built | Manual `yarn npm:publish` works (v0.1.1 on npm); no release workflow |
| N-2a | Release order with the site | Proposed | ❌ Not built | Releases and deploys are both manual and unrelated |
| N-3 | Versioning policy | Proposed | ❌ Not built | No written policy or changelog |
| N-4 | Package README | Proposed | 🟡 Partial | `catalog/README.md` exists but documents the wrong API |
| N-5 | Pack check in CI | Proposed | ❌ Not built | No CI |
| N-6 | Size budget | Proposed | ❌ Not built | Not tracked |

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
| Release | Manual: `yarn npm:publish` = build + `npm publish` from a dev machine | `catalog/package.json` scripts |
| Changelog | None | — |

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

### N-2 Automated release after `main` merge (`.github/workflows/release.yml`) · ❌ Not built
**Rule (Agreed, 2026-10-20):** after a merge to `main`, if the merge brings a **new feature or new/changed data into the catalog**, the npm release runs automatically. Merges that do not touch the catalog's code or data publish nothing. The site has its own rule ([07](./07-site-github-pages-delivery.md) P-1), and the [index](./README.md#automation-rules) summarizes both.

**What counts as "a catalog change"** (path filter):

| Triggers a release | Does not trigger a release |
|---|---|
| `catalog/data/**` (cards, relations, rules) | `catalog/**/*.md` (README, contributing guide; see TBD-N7) |
| `catalog/src/**` (query API, loader) | `catalog/**/*.test.ts`, test fixtures |
| `catalog/schema/**` | `docs/**`, `server/**` (or the future site folder), `.github/**` |
| `catalog/package.json` (version, dependencies, exports) | Lockfile-only changes (dev-dependency bumps from Dependabot) |

**Mechanism: version in the PR, publish on merge** *(recommended)*. Two workflows:

1. **PR check** (a job in `ci.yml`, [01](./01-repository-and-workspaces.md) R-4). If the PR changes any path in the "triggers" column:
   - `catalog/package.json` `version` must be **higher than the latest version on npm**, following the N-3 policy (data → patch, feature → minor);
   - `catalog/CHANGELOG.md` must have an entry for that version.

   The check fails with a clear message ("catalog data changed: bump the version, e.g. 0.1.1 → 0.1.2"). It is a **required status check** on `main` (branch protection, TBD-N6).

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
permissions: { contents: write, id-token: write }   # tag + release, npm provenance
concurrency: { group: npm-release, cancel-in-progress: false }   # never cancel a publish halfway
jobs:
  release:
    steps:
      - checkout, setup-node (registry-url: https://registry.npmjs.org), install
      - validate data + test + build catalog          # same gates as CI
      - read version from catalog/package.json
      - if that version already exists on npm → stop (no-op, job succeeds)
      - npm publish --provenance --access public       # from catalog/
      - git tag catalog-v<version> && push tag
      - create GitHub Release from the CHANGELOG entry
```

Why this mechanism:
- **One merge = one release.** Nothing else to merge, which matches the rule.
- **No bot commits to `main`.** The version bump is reviewed in the PR like any other change.
- **Safe to re-run.** "Already on npm" is a no-op, so a duplicate trigger or a manual dispatch cannot publish twice.
- **Data and feature releases stay distinguishable**, through the patch/minor bump (N-3) and the changelog entry.

Alternatives considered:

| Alternative | Why not the default |
|---|---|
| **Changesets** | Merging a PR opens a second "Version Packages" PR, and **publishing happens only when that second PR is merged**. That is not "after the main merge" |
| **semantic-release** (version from commit messages) | Fully automatic, but needs strict commit-message discipline, and the release bot pushes a version commit to `main` |
| Publish on a `v*` tag push | Needs a manual tag after each merge |

### N-2a Release order with the site · ❌ Not built
The site is built from the workspace catalog ([07](./07-site-github-pages-delivery.md) P-2). The two workflows therefore do not depend on each other: a merge that changes catalog data starts **both** the npm release and the Pages deploy, in parallel. If TBD-P2 decides the site must show only released data, the Pages workflow instead starts with `workflow_run` **after** `release.yml` succeeds (see 07 P-1).

### N-3 Versioning policy · ❌ Not built
While the package is `0.x`:

| Change | Bump |
|---|---|
| Data added or corrected (new cards, fixed stats) | **patch** |
| New API function, new optional field, new collection | **minor** |
| Field renamed or removed, shape change ([02](./02-catalog-data-model.md) D-2), function removed | **minor**, with a "BREAKING" note (0.x semver) |

Release `1.0.0` when the model in 02 is agreed and the card list is complete (**TBD-N3**).

### N-4 Package README · 🟡 Partial
`catalog/README.md` becomes the npm landing page: install, five-line usage, a link to the TypeDoc API ([04](./04-catalog-query-api.md) Q-8), a coverage badge, and a link to the site.

### N-5 Pack check in CI · ❌ Not built
Covered by [01](./01-repository-and-workspaces.md) R-4 step 5: `npm pack`, install the tarball into a scratch project, then `require` **and** `import` it and call `getCard(425)`. Optionally add `publint` and `@arethetypeswrong/cli` to lint the package shape.

### N-6 Size budget · ❌ Not built
Track the packed size in CI. At about 722 cards plus relations, a few hundred KB is the expected ceiling (**TBD-N4**). If relations grow large, offer subpath entries (`@mhsalves/yugioh-fb-catalog/fusions`) so consumers load only what they use.

## 5. Acceptance criteria

- [ ] Releases come only from CI. `npm:publish` is removed from local scripts.
- [ ] Merging a PR that changes `catalog/data/**` or `catalog/src/**` publishes the new version to npm with no manual step.
- [ ] Merging a PR that changes only docs, the site or CI publishes nothing.
- [ ] A PR that changes catalog code or data without a version bump fails CI.
- [ ] Re-running the release workflow for a version that is already published succeeds as a no-op.
- [ ] `import { getCard } from "@mhsalves/yugioh-fb-catalog"` and `require(...)` both work, with types.
- [ ] `npm pack --dry-run` lists only `dist/`, `data/`, `schema/`, `README.md`, `LICENSE`, `package.json`.
- [ ] Every published version has a `CHANGELOG.md` entry.
- [ ] Each published version shows npm provenance.

## 6. TBD / open questions

- ~~**TBD-N1:** Release trigger and mechanism.~~ **Resolved (2026-10-20):** an automatic release after a `main` merge that changes the catalog (rule agreed). The mechanism proposed is "version in PR, publish on merge" (N-2).
- **TBD-N6:** npm auth and repository settings. Options: **trusted publishing (OIDC)**, which needs no stored secret and is recommended, or an `NPM_TOKEN` automation secret. Both need branch protection on `main` that requires the CI check. Needs repository and npm admin.
- **TBD-N7:** Should README-only changes to `catalog/` trigger a release, so the npm page updates? Proposal: no. They ship with the next release.
- **TBD-N2:** Minimum Node version and JS target (ties to TBD-R3).
- **TBD-N3:** Criteria for `1.0.0`.
- **TBD-N4:** Size budget, and whether to split relations into subpath entries.
- **TBD-N5:** Should the raw `data/*.json` be part of the public, semver-covered contract, or "use at your own risk"?
