# 03 – Catalog data authoring (storage format and validation)

> **Status: Built** (A-5 built as a proposal: its source licensing, TBD-A4, is still open). Format decision **A-1 is Agreed: JSON** (2026-10-20). The rest of the spec follows from it.






## 0. Status

Build status as of 2026-10-20, after the spec 03 build PR (based on `main` @ `ce9dfcf`). Legend in the [index](./README.md#status-system).

**6 built · 0 partial · 0 not built**

| ID | Item | Decision | Build | What exists today |
|---|---|---|---|---|
| A-1 | Storage format: JSON + schema | Agreed | ✅ Built | `catalog/data/**/*.json` with `$schema`; Zod schemas in `catalog/schema/schemas.ts` export draft-07 JSON Schemas; a generated module feeds the library |
| A-2 | Validation rules | Agreed | ✅ Built | `yarn validate` (CI and before every build), every rule with a failing-fixture test |
| A-3 | Contributor guide | Agreed | ✅ Built | `catalog/CONTRIBUTING-DATA.md` (PT-BR, like the catalog README) |
| A-4 | Coverage report as a script | Agreed | ✅ Built | `yarn coverage:data` (also printed in CI) |
| A-5 | Import tooling | Proposed | ✅ Built | `yarn data:sync` (`catalog/scripts/sync-wiki.ts`) fills `catalog/data` from the Yu-Gi-Oh! Wiki; TBD-A4 still open |
| A-6 | PR template for data changes | Agreed | ✅ Built | `.github/PULL_REQUEST_TEMPLATE/data.md` |

## 1. Why this spec exists

Goal **G3**: the catalog must be **saved in a simple way so more information can be added later**. About 717 cards are still missing, and relation data (fusions, equips, drops: [02](./02-catalog-data-model.md) D-3) runs to thousands more records. Most of the project's future work is **data entry**, so the authoring experience matters more than any other design choice:

- adding a card must be **copy, paste and edit**, with no knowledge of the build;
- mistakes (wrong type, duplicate ID, an 8-digit password with 7 digits, a fusion pointing at a missing card) must be **caught automatically** with a clear message;
- adding a *new kind* of information (for example, a `rarity` field) must not mean touching every file by hand.

## 2. What exists today

> **Updated by the spec 03 build.** All data is JSON in `catalog/data/`, validated by `yarn validate` against Zod schemas (`catalog/schema/`). See the "As built" notes under A-1 and A-2. The list below describes the state **before** this spec was built (after [02](./02-catalog-data-model.md), the TS files were already at the target paths) and is kept for history.

- Cards are **TypeScript object literals** typed against their interfaces, for example `IMonsterCard[]` in `monsters/thunders/page1.ts`.
- `tsc` checks the record **shape** (field names, union values such as `cardType` and guardian stars).
- Files are concatenated by `index.ts` files at each folder level, and sorted by ID once at the root.
- The rules that `tsc` cannot check are written only as comments: password is 8 digits, cost 0–999999, level 1–12, the ID range per page.
- The steps for adding data are listed in `catalog/README.md` ("Contribuindo com Dados"), but the format examples there are outdated (see `ARCHITECTURE.md` S5).

**Why it is like this** (`ARCHITECTURE.md` §4.2): free compile-time validation, no I/O at runtime, and easy copy-paste contributions.

## 3. Gaps

| # | Gap |
|---|---|
| A-gap-1 | Value rules (ranges, formats) are not enforced. |
| A-gap-2 | No uniqueness check on `id`, and no referential check (a ritual or fusion pointing at an ID that does not exist). |
| A-gap-3 | A new sub-type folder needs boilerplate: the `index.ts`, the concat line, and a type-union edit. |
| A-gap-4 | The data is locked inside TS/JS. Non-JS consumers, spreadsheet-style bulk editing and import scripts cannot use it directly. |
| A-gap-5 | Bulk entry (hundreds of fusions) as hand-written TS object literals is verbose and error-prone. |
| A-gap-6 | The contributing docs show the wrong format. |

## 4. Proposed improvements

### A-1 Storage format: **JSON + schema** (**Agreed**) · ✅ Built

All catalog data, including cards **and** relation tables (fusions, equips, rituals, fields, duelists, drops), is stored as **JSON files** validated against a schema. TypeScript keeps only the query API ([04](./04-catalog-query-api.md)) and the schema definitions.

The other options and why they were not chosen:

| Option | Why not |
|---|---|
| Keep TS literals | Data stays locked in JS (A-gap-4), bulk entry is verbose, and every new folder needs `index.ts` boilerplate |
| YAML | Easier to read, but it needs a parser at build time and has its own pitfalls (implicit types, indentation). JSON is enough |
| CSV | Good for spreadsheets, but nested fields (guardian stars, ritual materials) get awkward. One format everywhere is simpler |

Why JSON works for this project:
- JSON can be edited in the GitHub web UI, so contributors need no tooling.
- With a JSON Schema referenced through `$schema`, VS Code gives autocomplete and inline errors as you type. This keeps most of the "free validation" that TS gives today.
- The same files can be shipped in the npm package (`@mhsalves/yugioh-fb-catalog/data/...`) for non-JS consumers ([05](./05-catalog-npm-distribution.md)).
- TS types are **inferred from** the schema (for example Zod's `z.infer<>`, with the JSON Schema exported from Zod), so there is still one source of truth. The schema library is TBD-A6.
- JSON imports natively in Node, in bundlers and in any site stack ([06](./06-site-ux-forbidden-memories.md)).

Conventions:
- Each file is an object with a `$schema` key and one array (`cards`, `fusions`, …). The object wrapper leaves room for file-level metadata later.
- Two-space indentation, one record per array element, keys in schema order (Prettier enforces this, see [01](./01-repository-and-workspaces.md) R-3), so diffs stay small.
- No comments (JSON has none). Notes go in an optional `notes` field (TBD-A5).

Proposed layout (follows [02](./02-catalog-data-model.md) D-5):

```
catalog/
├── data/                       # ← plain data, no code
│   ├── cards/monsters/dragon.json
│   ├── cards/monsters/thunder.json
│   ├── cards/magic.json  trap.json  equip.json  ritual.json
│   ├── fusions/*.json   (split by result monster type)
│   ├── equips.json  rituals.json  fields.json
│   └── duelists/*.json
├── schema/                     # Zod schemas → JSON Schema export
└── src/                        # query API only (04)
```

Example record (`data/cards/monsters/thunder.json`):

```json
{
  "$schema": "../../../schema/monster-list.schema.json",
  "cards": [
    {
      "id": 425,
      "name": "Thunder Dragon",
      "description": "A dragon that summons thunder and lightning to attack its opponents.",
      "cardType": "Monster",
      "monsterType": "Thunder",
      "level": 5,
      "attack": 1600,
      "defense": 1500,
      "guardianStars": ["Pluto", "Jupiter"],
      "password": { "code": "31786629", "cost": 230 }
    }
  ]
}
```

Loading: a small loader in `src/` imports every JSON file. A build step generates the import list by scanning `data/`, so adding a file needs no code change (fixes A-gap-3). The loader then validates the data against the schema and builds the indexes from [04](./04-catalog-query-api.md) Q-2.

Migration: the 5 existing TS records are converted to JSON once, the `pageN.ts`/`index.ts` data files are deleted, and `card-types.ts` is replaced by types inferred from the schema. The public type names (`ICard`, `IMonsterCard`, …) stay exported.

**As built** (differences from the proposal above, and why):

| Topic | Built |
|---|---|
| Layout | As proposed: `catalog/data/` (JSON), `catalog/schema/` (`schemas.ts` + the generated `<name>.schema.json` files), `catalog/src/` (query API). Plus `catalog/scripts/` for the CLI scripts. The files are `cards/monsters/<type>.json`, `cards/{magic,trap,equip,ritual}.json`, `rituals.json`, `equips.json`, `fields.json`, `fusions/<result type>.json`, `rules.json` |
| Schema tool (TBD-A6) | **Zod 4**, as a **dev-only** dependency. `schemas.ts` uses the runtime lists from `src/data/enums.ts` (`z.enum(MONSTER_TYPES)`), so the enums stay single-source. `yarn schema:build` writes **draft-07** JSON Schemas, chosen for the widest editor support, and tests fail if the committed files are stale |
| Public types | **Kept hand-written** in `src/data/card-types.ts` and `relation-types.ts`, instead of `z.infer`. `schemas.ts` asserts at compile time that each one equals what its schema accepts, so they cannot drift (checked: changing a field type fails `yarn typecheck`). This keeps Zod out of the published `.d.ts` files, so consumers install no new dependency, and keeps the types readable in editors |
| Loader | `yarn data:build` (`scripts/build-data.ts`) validates `data/` and writes `src/data/catalog.generated.ts` (git-ignored). The library reads from that module, so the package still ships plain compiled JS with no runtime validation or file I/O. The data is validated before every build instead. It runs automatically before `build`, `dev`, `typecheck` and `test`, and `yarn dev` watches `data/`, so a saved JSON edit appears on the running site |
| Indexes | Not built here; they belong to [04](./04-catalog-query-api.md) Q-2 |
| Strictness | Objects are strict (`additionalProperties: false`), so a misspelled field is an error |
| Migration | Done. The 5 cards, the ritual recipe and all rule values are identical to the TS data (compared against the packed `0.2.0` build) |

### A-2 Validation rules (enforced in tests and in `prebuild`) · ✅ Built
Implemented as one `validate` script that runs in CI ([01](./01-repository-and-workspaces.md) R-4) and before every build, with errors that point to the file and the record:

| Rule | Example error |
|---|---|
| Schema / shape | `cards/monsters/thunder.json[0].level: expected 1..12, got 13` |
| `id` unique across all cards | `id 425 defined in thunder.json and dragon.json` |
| `id` within `1..TOTAL_CARDS` | — |
| `password.code` matches `^\d{8}$`, `cost` 0..999999 | — |
| `monsterType` matches the file it lives in | `dragon.json contains a Thunder monster (id 425)` |
| Every relation ID exists (rituals, fusions, equips, drops) | `rituals.json: ritual 674 → material 186 not found` (this is a **warning** while data is incomplete, see TBD-A3) |
| Fusion pairs not duplicated (order-insensitive) | — |
| Names unique (warning) | — |

**As built:** every rule above is in `catalog/scripts/lib/data.ts`, run by `yarn validate`, by CI and before every build. Each rule has a failing-fixture test in `catalog/test/validate.test.ts`. Errors fail the build; warnings are listed by `yarn validate` and counted by `data:build`. Rules added while building, following [02](./02-catalog-data-model.md):

| Rule | Level | Example message |
|---|---|---|
| Card in the file of its `cardType` (schema per file) | error | `cards/magic.json: cards[0].cardType: …` |
| Monster type file names are real types (`winged-beast.json`) | error | `"dragons" is not a monster type file name` |
| File outside the layout | error | `notes.json: unknown data file` |
| `$schema` path matches the file | error | `$schema: expected "../../schema/magic-list.schema.json"` |
| Relation points at the right kind of card (ritual → Ritual card, result/materials/targets → Monster, equip → Equip, field → Magic) | error | `equip 20 → target 30 is a Magic card, expected Monster` |
| Relation ID within `1..totalCards` | error | `ritual 10 → result 900 is out of range (1..722)` |
| One recipe per ritual, one entry per equip and field | error | `ritual 10 has more than one recipe` |
| Fusion materials sorted (`a <= b`); result type matches `fusions/<type>.json` | error | `fusion 2 + 1: materials must be sorted (write 1 + 2)` |
| Ritual card without a recipe | warning | `ritual card 10 has no recipe in rituals.json` |
| Relation ID not entered yet (TBD-A3) | warning | `rituals.json: ritual 674 → material 186 not found (card not entered yet)` |

### A-3 Contributor guide `catalog/CONTRIBUTING-DATA.md` · ✅ Built
A one-page guide covering: where each kind of card goes, a copyable template per card type, how to add the card's image line to `data/images.json` (paste the wiki image URL, [08](./08-card-images.md) I-2), how to run `yarn validate`, and how to cite a source in the PR. It replaces the outdated section in `catalog/README.md`.

### A-4 Coverage report as a script · ✅ Built
`yarn coverage:data` prints the entered count per category and overall (`5 / 722`). The site shows the same numbers ([06](./06-site-ux-forbidden-memories.md)), and CI can post them as a PR comment.

### A-5 (Later) Import tooling · ✅ Built
An optional script in `catalog/tools/` that converts a trusted external dump into the data files. It speeds up the initial bulk fill. It depends on **TBD-X1** (the source) and **TBD-A4** (licensing of that source).

**As built (2026-10-23):** `yarn data:sync [--dry-run] [--overwrite]` runs `catalog/scripts/sync-wiki.ts`, next to the other data scripts rather than in `catalog/tools/`. Its source is the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/wiki/List_of_Yu-Gi-Oh!_Forbidden_Memories_cards) on Fandom, read through its API (no HTML scraping):

- **Cards** come from the Semantic MediaWiki properties of the `<name> (FMR)` pages (`action=ask`, 2 requests for all 722): number, name, lore, card type, spell property (`Equip Spell Card` → `Equip`, other spells → `Magic`), type, level, ATK/DEF, guardian stars, passcode and star chip cost.
- **Ritual recipes** come from the `ritual_card` and `ritual_material` parameters of the result monster's `{{FMR card}}` template, so every monster page's wikitext is read (13 requests). Card names are matched to ids over every wiki card, ignoring case; a name that matches no card or more than one is reported, not guessed.
- **Nothing is guessed** (spec 02): a card with only one of passcode and star chip cost, an unknown type or without two guardian stars is skipped and listed. A card with neither is entered **without `password`**: the game gives no password to the 24 ritual results and story cards (364, 380, 701–722 and others), which both game-data dumps confirm ([Decomp] `card-catalog.csv` has `N/A`, [FusionCalc] the placeholder `00000000`). `password` is optional in the model for this reason (catalog 0.4.0).
- **Hand-entered data wins.** A record already in `catalog/data` is kept, and every field where it differs from the wiki is printed; `--overwrite` replaces it. On the first run the 5 hand-entered cards and the recipe for ritual 674 matched the wiki exactly.
- **Checked against the game data.** All 722 cards were compared with [FusionCalc] `Cards.json` and [Decomp] `card-catalog.csv` (spec 02 §6). Where both agree against the wiki, the catalog follows them: 16 fields on 15 cards (213, 285, 393, 402, 430, 436, 456, 473, 493, 500, 534, 580, 606, 637, 678; for example 580 DEF 900, wiki 1900). Later syncs keep these fixes and list them as `differ (kept)`; `--overwrite` would undo them. After the fixes every card matches the decompilation, apart from FusionCalc's ASCII spelling "Kuwagata a" for 480 Kuwagata α.
- The merged data runs through `validateData` before any file is written, and files are written with Prettier. The conversion is pure (`scripts/lib/wiki.ts`) and tested on fixtures (`test/wiki.test.ts`), with no network in the tests.
- Requests send a project `User-Agent` and wait one second between calls.

TBD-X1 now has a working answer for card stats and rituals (the wiki), but fusions, equips and fields are not on these pages and still need a source. TBD-A4 is not resolved by the script: see §6.

### A-6 PR template for data changes · ✅ Built
`.github/PULL_REQUEST_TEMPLATE/data.md` with these checks: source cited, `yarn validate` passed, only data files touched.

## 5. Acceptance criteria

- [x] Adding a card = editing **one** data file. No `index.ts` or type edits. (A new monster type's first card means creating `cards/monsters/<type>.json`; no code changes.)
- [x] Each rule in A-2 has a failing-fixture test that proves it catches the error (`catalog/test/validate.test.ts`).
- [x] All data lives in `catalog/data/**/*.json`, with no card data left in `.ts` files.
- [x] VS Code flags a bad field in a JSON file before commit (via `$schema`). Each file points at a draft-07 JSON Schema with strict objects, ranges and enums. VS Code reads `$schema` natively; this was not clicked through in an editor during the build.
- [x] `CONTRIBUTING-DATA.md` exists and matches the real format.
- [x] The existing 5 cards are migrated with no change to their data.

## 6. TBD / open questions

- ~~**TBD-A1:** Storage format.~~ **Resolved (2026-10-20): JSON** for all data.
- ~~**TBD-A2:** Fusions and drops in JSON or CSV?~~ **Resolved: JSON**, the same as everything else. An importer (A-5) may *read* CSV from a source, but the repository stores JSON.
- **TBD-A3:** While data is incomplete, should a missing referenced ID be an **error** or a **warning**? Proposal: a warning until coverage reaches 100%, then an error. **Built as proposed (2026-10-20):** a missing card is a warning. A wrong card kind or an out-of-range ID is always an error. Switching to errors at 100% coverage is still to do.
- **TBD-A4:** Licensing and attribution for imported community data. Each source needs checking before any bulk import. **Open, needs a decision before the first synced data ships.** The Yu-Gi-Oh! Wiki's text is CC BY-SA 3.0 (attribution and share-alike, see also [08](./08-card-images.md) TBD-I2), while the package is MIT. Most synced fields are game facts (numbers, stats, passwords) and the lore is Konami's in-game text, which the wiki only transcribes, but the compilation itself may still count. Options: (a) ship it with attribution in the README and keep the data CC BY-SA, separate from the MIT code; (b) use the wiki only to cross-check data taken from the game itself (spec 02 §6 sources); (c) ask the wiki's community. `catalog/README.md` credits the wiki for now.
- **TBD-A5:** Should each record carry a `source` field (for provenance) and an optional `notes` field? Or should provenance live only in PR descriptions? Open. For now provenance is in PR descriptions (the data PR template asks for it), and the strict schema rejects unknown fields until this is decided.
- **TBD-A6:** Schema tool: Zod (types + runtime validation, with JSON Schema exported from it), or a hand-written JSON Schema with Ajv plus generated types? **Built with Zod 4 (2026-10-20)**, dev-only, exporting draft-07 JSON Schemas. Public types stay hand-written and are asserted equal to the schemas (see A-1 "As built").
