# 03 – Catalog data authoring (storage format and validation)

> **Status: Proposed.** Format decision **A-1 is Agreed: JSON** (2026-10-20). The rest of the spec follows from it.

## 1. Why this spec exists

Goal **G3**: the catalog must be **saved in a simple way so more information can be added later**. About 717 cards are still missing, and relation data (fusions, equips, drops: [02](./02-catalog-data-model.md) D-3) runs to thousands more records. Most of the project's future work is **data entry**, so the authoring experience matters more than any other design choice:

- adding a card must be **copy, paste and edit**, with no knowledge of the build;
- mistakes (wrong type, duplicate ID, an 8-digit password with 7 digits, a fusion pointing at a missing card) must be **caught automatically** with a clear message;
- adding a *new kind* of information (for example, a `rarity` field) must not mean touching every file by hand.

## 2. What exists today

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

### A-1 Storage format: **JSON + schema** (**Agreed**)

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

### A-2 Validation rules (enforced in tests and in `prebuild`)
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

### A-3 Contributor guide `catalog/CONTRIBUTING-DATA.md`
A one-page guide covering: where each kind of card goes, a copyable template per card type, how to run `yarn validate`, and how to cite a source in the PR. It replaces the outdated section in `catalog/README.md`.

### A-4 Coverage report as a script
`yarn coverage:data` prints the entered count per category and overall (`5 / 722`). The site shows the same numbers ([06](./06-site-ux-forbidden-memories.md)), and CI can post them as a PR comment.

### A-5 (Later) Import tooling
An optional script in `catalog/tools/` that converts a trusted external dump into the data files. It speeds up the initial bulk fill. It depends on **TBD-X1** (the source) and **TBD-A4** (licensing of that source).

### A-6 PR template for data changes
`.github/PULL_REQUEST_TEMPLATE/data.md` with these checks: source cited, `yarn validate` passed, only data files touched.

## 5. Acceptance criteria

- [ ] Adding a card = editing **one** data file. No `index.ts` or type edits.
- [ ] Each rule in A-2 has a failing-fixture test that proves it catches the error.
- [ ] All data lives in `catalog/data/**/*.json`, with no card data left in `.ts` files.
- [ ] VS Code flags a bad field in a JSON file before commit (via `$schema`).
- [ ] `CONTRIBUTING-DATA.md` exists and matches the real format.
- [ ] The existing 5 cards are migrated with no change to their data.

## 6. TBD / open questions

- ~~**TBD-A1:** Storage format.~~ **Resolved (2026-10-20): JSON** for all data.
- ~~**TBD-A2:** Fusions and drops in JSON or CSV?~~ **Resolved: JSON**, the same as everything else. An importer (A-5) may *read* CSV from a source, but the repository stores JSON.
- **TBD-A3:** While data is incomplete, should a missing referenced ID be an **error** or a **warning**? Proposal: a warning until coverage reaches 100%, then an error.
- **TBD-A4:** Licensing and attribution for imported community data. Each source needs checking before any bulk import.
- **TBD-A5:** Should each record carry a `source` field (for provenance) and an optional `notes` field? Or should provenance live only in PR descriptions?
- **TBD-A6:** Schema tool: Zod (types + runtime validation, with JSON Schema exported from it), or a hand-written JSON Schema with Ajv plus generated types?
