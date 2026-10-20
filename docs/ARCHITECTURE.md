# Architecture

This document describes how the Yu-Gi-Oh! Forbidden Memories catalog is put together, why it is built this way, and what its current state is. It is meant as the starting point for improving the project.

> Some of the reasons below are not written down anywhere in the repository. Where a reason is **inferred** from the code and the git history (and not stated by the author), it is marked *(inferred)*.

---

## 1. What the project is

A typed, offline dataset of the cards in *Yu-Gi-Oh! Forbidden Memories* (PS1, 1999), published in two forms:

1. **An npm library**, `@mhsalves/yugioh-fb-catalog`. It ships the card data plus a few lookup functions.
2. **A static website** on GitHub Pages (`https://mhsalves.github.io/yugioh-fb-catalog`). It uses the library to show which card IDs are in the catalog and which are still missing.

There is no backend, database or API. All of the data is TypeScript source code.

---

## 2. High-level view

```mermaid
flowchart LR
    subgraph repo["Git repository (one repo, no workspaces)"]
        direction TB
        subgraph catalog["catalog/ (library package)"]
            types["data/card-types.ts<br/>(domain types)"]
            data["data/cards/**<br/>(card records as TS literals)"]
            tools["tools/cards.ts<br/>(query functions)"]
            entry["index.ts<br/>(public API)"]
            types --> data --> tools --> entry
        end
        subgraph server["server/ (Next.js static site)"]
            page["pages/index.tsx"]
            item["components/CardItemView.tsx"]
            page --> item
        end
    end

    catalog -- "tsc → lib/ → npm publish" --> npm[("npm registry<br/>@mhsalves/yugioh-fb-catalog")]
    npm -- "yarn install (^0.1.1)" --> server
    server -- "next build (output: export) → out/ → gh-pages" --> pages[("GitHub Pages")]
    npm --> consumers["Third-party apps"]
```

The important detail: **the website does not import the library from the repository.** It installs the *published* version from npm. Changes to the data appear on the site only after you publish a new library version and update the server's dependency.

---

## 3. Repository layout

```
.
├── catalog/                 # The library (current source of truth)
│   ├── package.json         # @mhsalves/yugioh-fb-catalog@0.1.1
│   ├── tsconfig.json        # CommonJS, ES2016, emits lib/ + .d.ts
│   └── src/
│       ├── index.ts         # Public API: re-exports types + tools
│       ├── data/
│       │   ├── card-types.ts        # Domain model
│       │   ├── duelists/            # Empty placeholder (.gitkeep)
│       │   └── cards/
│       │       ├── index.ts         # Merges every category, sorts by id
│       │       ├── monsters/
│       │       │   └── thunders/page0..3.ts
│       │       ├── rituals/page0..3.ts
│       │       └── support/{equip,magic,trap}.ts
│       └── tools/cards.ts           # Query functions
├── .github/dependabot.yml   # Weekly grouped dependency updates
├── server/                  # Next.js 15 + MUI static site
│   ├── next.config.js       # output: 'export', basePath for GH Pages
│   └── src/
│       ├── pages/index.tsx
│       └── components/{Header,CardItemView}.tsx
└── README.md                # Project overview (Portuguese)
```

---

## 4. The library (`catalog/`)

### 4.1 Domain model, `card-types.ts`

```mermaid
classDiagram
    class ICardBase {
        id: number
        name: string
        password: IPassword
        description: string
    }
    class IPassword {
        code: string  // 8 digits
        cost: number  // 0..999999 starchips
    }
    class ISupportCard {
        cardType: "Equip" | "Magic" | "Trap"
    }
    class IRitualCard {
        cardType: "Ritual"
        summon: IRitualSummon
    }
    class IRitualSummon {
        monsterResultId: number
        monsterMaterialIds: number[]
    }
    class IMonsterCard {
        cardType: "Monster"
        level: number  // 1..12
        monsterType: TMonsterType
        monsterPoints: attack, defense
        guardianStars: first, second
    }
    ICardBase <|-- ISupportCard
    ICardBase <|-- IRitualCard
    ICardBase <|-- IMonsterCard
    ICardBase *-- IPassword
    IRitualCard *-- IRitualSummon
```

`ICard = ISupportCard | IRitualCard | IMonsterCard` is a **discriminated union** on `cardType`.

**Why:**
- The union lets TypeScript narrow types. After `card.cardType === "Monster"`, the compiler knows `card.monsterPoints` exists. `getCardsByMonsterType` relies on this.
- The fields follow the game's own concepts rather than the modern TCG. Forbidden Memories has **guardian stars** and **starchip costs**, and has no attributes. Rituals are modelled as a *recipe*: a result monster plus material monster IDs. The game treats ritual cards this way, so a later fusion or ritual calculator can work on IDs alone.
- **`id` is the in-game card number** (1–722). It is a natural key and needs no extra mapping table.
- References between cards (`monsterResultId`, `monsterMaterialIds`) use plain IDs, not nested objects. The data then stays flat and serialisable, and you can declare cards in any order.

### 4.2 Data storage: cards as TypeScript literals

Every card is an object literal in a `.ts` file, typed against its interface (`IMonsterCard[]`, `IRitualCard[]` or `ISupportCard[]`).

**Why** *(inferred)*:
- **Free validation.** `tsc` checks each record when it compiles. A missing field, a wrong `cardType` or a misspelled guardian star breaks the build. No JSON schema or runtime validator is needed.
- **No I/O.** The data is bundled into the compiled JS, so consumers (Node, browsers, the static site) can `import` it synchronously with no fetch or file read.
- **Easy contributions.** Adding a card means pasting an object into a file that already shows the format.

**Trade-offs:**
- The compiler cannot check value ranges (8-digit password, level 1–12, cost 0–999999), unique IDs, or whether referenced IDs exist. Today these rules exist only as comments.
- The full dataset ends up in every consumer's bundle. At about 722 small records this is acceptable.
- Non-JS consumers (Python scripts, other tools) cannot read the data directly.

### 4.3 Data organization: category → sub-category → "page"

```
cards/index.ts              concat(monsters, rituals, support).sort(by id)
├── monsters/index.ts       concat(thunders)
│   └── thunders/index.ts   concat(page0..page3)
├── rituals/index.ts        concat(page0..page3)
└── support/index.ts        concat(equip, magic, trap)
```

Each `pageN.ts` file holds **one contiguous ID range**, recorded in its header comment. For example, `thunders/page1.ts` holds Thunder monsters 425–460 and `rituals/page1.ts` holds rituals 674–679.

**Why** *(inferred from commits `c8eebe5`, `3857bd4`, `b06fbd3`, `34a8813`)*:
- **Small files.** Splitting about 722 cards over many files keeps diffs and merge conflicts local, and each file stays easy to review.
- **Pages mirror the source.** Contiguous ID ranges match how the in-game library and most reference lists are browsed. One person can fill in one page at a time.
- **Every level is a plain `concat`.** Adding a new monster type (for example `dragons/`) is a new folder plus one line in `monsters/index.ts`.
- **One sort at the root.** File order does not matter, and the exported list is always in ID order.

### 4.4 Public API, `tools/cards.ts` and `index.ts`

| Function | Behaviour |
|---|---|
| `getCardList()` | Every card, sorted by `id` |
| `getCard(id)` | One card or `undefined` (linear `find`) |
| `getCardsByType(cardType)` | Filter on `cardType` |
| `getCardsByMonsterType(monsterType)` | Monsters of one type |

`index.ts` re-exports all types (`export type *`) and the functions above. The raw `data/` modules are not part of the public API.

**Why:** consumers depend on a small function API rather than the file layout, so the data can be reorganised (for example, re-paged) without a breaking change.

### 4.5 Build and publish

- `tsc` with `module: commonjs`, `target: es2016`, `declaration: true`, output in `lib/`.
- `.npmignore` removes `src/` and `tsconfig.json`, so the package contains only `lib/` (JS + `.d.ts`).
- `yarn npm:publish` builds and publishes. This is a manual step with no CI.

**Why CommonJS/ES2016** *(inferred)*: it is the format with the widest compatibility. It loads in old and new Node versions and in bundlers such as Next.js/webpack with no extra setup.

---

## 5. The website (`server/`)

Despite the folder name, this is **not a server**. It is a Next.js app built with `output: 'export'` into static HTML/JS in `out/`, then pushed to the `gh-pages` branch.

### 5.1 Behaviour

`pages/index.tsx` renders `TOTAL_CARDS = 721` slots (`CardItemView` for IDs 1..721). Each slot calls `getCard(id)`:
- the card exists → show name, description, type, password and cost
- the card is missing → show "Not available yet", or hide it when the **Only Available** switch is on (the default)

In practice, the site is a **coverage report** for the dataset: it shows how much of the game has been entered.

### 5.2 Stack and reasons

| Choice | Reason |
|---|---|
| Next.js with static export | The data is static and bundled, so no server is needed. Static export works on free GitHub Pages hosting. Commit `2e50981` removed an earlier Express/nodemon server for this reason. |
| `basePath`/`assetPrefix` `/yugioh-fb-catalog` in production | GitHub Pages serves project sites under `/<repo>/`. |
| `images.unoptimized` | Next's image optimiser needs a running server, which static export does not have. |
| `touch out/.nojekyll` | Stops GitHub Pages' Jekyll from ignoring the `_next/` folder (Jekyll skips paths that start with an underscore). |
| MUI + Toolpad `PageContainer` | Ready-made, decent-looking components without writing CSS. |
| Depends on the **npm** package, not the local folder | The site doubles as a real consumer of the published package, so it confirms that what ships to npm works *(inferred)*. The cost is a publish-then-bump step before any data change appears on the site. |

### 5.3 Deploy

```
yarn gh:deploy  =  next build  →  touch out/.nojekyll  →  gh-pages -d out
```

This runs manually from a developer machine.

---

## 6. End-to-end flow for a data change

```mermaid
sequenceDiagram
    actor Dev
    participant Cat as catalog/
    participant NPM as npm registry
    participant Srv as server/
    participant GH as GitHub Pages
    Dev->>Cat: add card object to the right pageN.ts
    Dev->>Cat: tsc (type-checks the record)
    Dev->>Cat: bump version, yarn npm:publish
    Cat->>NPM: lib/ (JS + .d.ts)
    Dev->>Srv: bump @mhsalves/yugioh-fb-catalog, yarn install
    Dev->>Srv: yarn gh:deploy
    Srv->>GH: static out/
```

---

## 7. Current state and known issues

Checked on 2026-10-20 against `main` @ `4d80225`. `catalog/` type-checks cleanly with `tsc --noEmit`.

### 7.1 Data coverage
Only **6 of about 722 cards** have been entered: 1 Thunder monster (425), 1 ritual (674), and 1 each of equip (315), magic (332) and trap (690). Most `pageN.ts` files are empty arrays with a range comment. `TMonsterType` has only `"Thunder" | "Dragon"`, and `data/duelists/` is an empty placeholder (probably intended for duelist drop and deck tables).

### 7.2 Structural problems
| # | Issue | Evidence | Impact |
|---|---|---|---|
| S1 | ~~**Duplicated library.**~~ **Resolved.** Commit `7f15bd0` "Move all catalog files to a folder" *copied* `src/` into `catalog/src/` instead of moving it. The stale root `src/`, `package.json` (v0.1.0), `tsconfig.json`, `yarn.lock` and `.npmignore` have since been deleted. | — | — |
| S2 | ~~**Dependency drift between the copies.**~~ **Resolved** together with S1. | — | — |
| S3 | **No workspace linking.** The server consumes the published npm version. | `server/package.json` | Every data change needs publish + bump + deploy. Unpublished changes cannot be previewed locally. |
| S4 | **Hard-coded card count** `TOTAL_CARDS = 721` in the UI. FM has 722 cards (verify). | `server/src/pages/index.tsx` | Duplicates knowledge that belongs in the library, and may be off by one. |
| S5 | **README docs do not match the code.** `src/README.md` and `catalog/README.md` describe `getCards`, `getCardById(id: string)`, string IDs, lowercase types and an `attribute` field, none of which exist. `server/README.md` lists search, theming, stats, `styles/`, `utils/` and `NEXT_PUBLIC_API_URL`, also not present. Reference links are `(URL)` placeholders. | READMEs vs `card-types.ts` / `tools/cards.ts` | Misleads contributors and package users. |

### 7.3 Quality and tooling gaps
| # | Issue |
|---|---|
| Q1 | No tests and no data integrity checks (unique IDs, value ranges, ritual references pointing to real monsters, page range matching the header comment). |
| Q2 | No CI. Publishing to npm and deploying to Pages are manual, and nothing type-checks PRs (Dependabot PRs are merged unverified). |
| Q3 | There is no linter or formatter. The unused, deprecated `tslint` was removed; ESLint and Prettier are the usual replacements. |
| Q4 | `getCard` is a linear scan, called 721 times per render (O(n²)). This is negligible at the current size but trivial to fix with a `Map` index. |
| Q5 | The server has `strict: false`. |
| Q6 | The library emits only CommonJS/ES2016, with no `exports` map or ESM build. |
| Q7 | The site shows only base fields. Monster stats, guardian stars and ritual recipes are in the data but not rendered. There is no search or filtering beyond the availability toggle. |

---

## 8. Suggested improvement roadmap

> Detailed, reviewable proposals for each item below live in [`specs/`](./specs/README.md).

Ordered so that each step makes the next one safer.

1. ~~**Single source of truth (S1, S2).**~~ Done: the root copy was deleted and `catalog/` is the only library.
2. **Monorepo workspaces (S3).** Add a root `package.json` with `"workspaces": ["catalog", "server"]` (Yarn, npm or pnpm). The server then imports the local library during development, and data changes appear immediately.
3. **Tests and integrity checks (Q1).** Add Vitest or Jest tests that assert unique IDs, value ranges, valid ritual references, IDs inside each page's declared range, and that `getCardList()` is sorted. These matter most once many people contribute data.
4. **CI (Q2).** Add a GitHub Actions workflow that type-checks, tests and builds both packages on every PR. Then automate the Pages deploy on push to `main` (`actions/deploy-pages`), and npm publishing on tags or with Changesets.
5. **Fix the docs (S5).** Rewrite the READMEs from the real API, or generate API docs with TypeDoc, and link to this file.
6. **Library API polish (S4, Q4, Q6).** Export `TOTAL_CARDS` and a progress helper, index cards in a `Map` for `getCard`, and consider a dual ESM/CJS build with an `exports` map.
7. **Fill in the data (§7.1).** Extend `TMonsterType` to every FM type, add the matching `monsters/<type>/` folders, and decide on the shape of `duelists/` (drop tables, decks). Consider a scraper or importer script in `tools/` that generates the page files from a trusted source.
8. **Website features (Q7).** Add a card detail view, search, filters by type, monster type and stars, a progress bar, and, once the data exists, fusion or ritual lookups.
