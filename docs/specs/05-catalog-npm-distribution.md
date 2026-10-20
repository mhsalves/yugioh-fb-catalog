# 05 – Catalog distribution on the npm registry

> **Status: Proposed.**

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

### N-1 Dual ESM + CJS build with an `exports` map
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

### N-2 Automated release from CI
`.github/workflows/release.yml`, using **Changesets** *(recommended)*:

1. Contributors add a `.changeset/*.md` in their PR ("patch: add 40 Dragon monsters").
2. On `main`, the Changesets action opens or updates a "Version Packages" PR (bumps the version, writes `CHANGELOG.md`).
3. Merging that PR publishes to npm with `npm publish --provenance`, using an npm automation token or trusted publishing (OIDC).

Alternative: publish on a `v*` git tag push. This is simpler but does not generate the changelog automatically. **TBD-N1**

### N-3 Versioning policy
While the package is `0.x`:

| Change | Bump |
|---|---|
| Data added or corrected (new cards, fixed stats) | **patch** |
| New API function, new optional field, new collection | **minor** |
| Field renamed or removed, shape change ([02](./02-catalog-data-model.md) D-2), function removed | **minor**, with a "BREAKING" note (0.x semver) |

Release `1.0.0` when the model in 02 is agreed and the card list is complete (**TBD-N3**).

### N-4 Package README
`catalog/README.md` becomes the npm landing page: install, five-line usage, a link to the TypeDoc API ([04](./04-catalog-query-api.md) Q-8), a coverage badge, and a link to the site.

### N-5 Pack check in CI
Covered by [01](./01-repository-and-workspaces.md) R-4 step 5: `npm pack`, install the tarball into a scratch project, then `require` **and** `import` it and call `getCard(425)`. Optionally add `publint` and `@arethetypeswrong/cli` to lint the package shape.

### N-6 Size budget
Track the packed size in CI. At about 722 cards plus relations, a few hundred KB is the expected ceiling (**TBD-N4**). If relations grow large, offer subpath entries (`@mhsalves/yugioh-fb-catalog/fusions`) so consumers load only what they use.

## 5. Acceptance criteria

- [ ] Releases come only from CI. `npm:publish` is removed from local scripts.
- [ ] `import { getCard } from "@mhsalves/yugioh-fb-catalog"` and `require(...)` both work, with types.
- [ ] `npm pack --dry-run` lists only `dist/`, `data/`, `schema/`, `README.md`, `LICENSE`, `package.json`.
- [ ] Every published version has a `CHANGELOG.md` entry.
- [ ] Each published version shows npm provenance.

## 6. TBD / open questions

- **TBD-N1:** Changesets (recommended) or tag-based publishing?
- **TBD-N2:** Minimum Node version and JS target (ties to TBD-R3).
- **TBD-N3:** Criteria for `1.0.0`.
- **TBD-N4:** Size budget, and whether to split relations into subpath entries.
- **TBD-N5:** Should the raw `data/*.json` be part of the public, semver-covered contract, or "use at your own risk"?
