# 04 – Catalog query API (read and search)

> **Status: Proposed.**

## 1. Why this spec exists

Goal **G5**: the catalog must **offer methods to search and read** the data. The public functions are the package's contract with its consumers (the site, and third-party apps). `ARCHITECTURE.md` §4.4 explains why the API matters: consumers depend on functions, not on the file layout, so the data can be reorganized ([02](./02-catalog-data-model.md), [03](./03-catalog-data-authoring.md)) **without breaking anyone**. For that to hold, the API must cover what consumers need, so they never have to reach into raw data files.

## 2. What exists today

`catalog/src/tools/cards.ts`, re-exported from `catalog/src/index.ts`:

| Function | Behaviour |
|---|---|
| `getCardList()` | All cards, sorted by `id` (returns the internal array itself) |
| `getCard(id: number)` | One card or `undefined`. A linear `find` |
| `getCardsByType(cardType)` | Filter on `cardType` |
| `getCardsByMonsterType(monsterType)` | Monsters of one type |

All types are exported with `export type *`.

**What is good:** a small, typed API, with the data hidden behind functions.

## 3. Gaps

| # | Gap |
|---|---|
| Q-gap-1 | No text search (by name or description). |
| Q-gap-2 | No combined filtering (for example, Dragons with level ≤ 4 and ATK ≥ 1500 that have the Sun star). |
| Q-gap-3 | No sorting or paging options. |
| Q-gap-4 | No access to relations: fusions, rituals, equips, drops ([02](./02-catalog-data-model.md) D-3). |
| Q-gap-5 | `getCard` is O(n) and the site calls it 721 times per render (`ARCHITECTURE.md` Q4). |
| Q-gap-6 | `getCardsByType("Monster")` returns `ICard[]`, not `IMonsterCard[]`, so callers must narrow the type again. |
| Q-gap-7 | `getCardList()` returns the internal mutable array, so a consumer can corrupt it. |
| Q-gap-8 | No metadata: total count, coverage, lists of valid types and stars (needed for site filters). |
| Q-gap-9 | Documented names (`getCards`, `getCardById(string)`) differ from the real ones (`ARCHITECTURE.md` S5). |

## 4. Proposed improvements

### Q-1 Keep the existing functions (non-breaking)
`getCardList`, `getCard`, `getCardsByType` and `getCardsByMonsterType` keep working. They are reimplemented on top of the indexes in Q-2.

### Q-2 Indexes built once at module load
`Map<id, card>`, plus maps by `cardType`, by `monsterType` and by guardian star, and a fusion lookup keyed by material pair. With about 722 cards and a few thousand fusions, this is cheap and makes every read O(1) or O(k).

### Q-3 Typed overloads
```ts
function getCardsByType(t: "Monster"): readonly IMonsterCard[];
function getCardsByType(t: "Magic"):   readonly IMagicCard[];
// …
```
Return `readonly` arrays, and deep-freeze the data in development builds (fixes Q-gap-7).

### Q-4 `searchCards`: one flexible query function
```ts
interface CardQuery {
  text?: string;                       // matches name (and description if includeDescription)
  includeDescription?: boolean;
  cardType?: TCardType | TCardType[];
  monsterType?: TMonsterType | TMonsterType[];
  guardianStar?: TGuardianStar | TGuardianStar[];   // matches either star
  level?: Range;  attack?: Range;  defense?: Range;  cost?: Range;
  ids?: CardId[];
  sort?: { by: "id" | "name" | "attack" | "defense" | "level" | "cost"; dir?: "asc" | "desc" };
  limit?: number; offset?: number;
}
type Range = { min?: number; max?: number };

function searchCards(q: CardQuery): { total: number; items: readonly ICard[] };
```
- Text matching is case- and accent-insensitive substring matching. Fuzzy matching is **TBD-Q1**.
- Pure and synchronous, with no dependencies, so it works in the browser (the site) and in Node.
- The site's filters ([06](./06-site-ux-forbidden-memories.md)) are a thin UI over this function, so the site and npm users get the same behaviour.

### Q-5 Relation queries (added as the data from 02 lands)
| Function | Answers |
|---|---|
| `getFusion(a, b)` | What do these two cards fuse into? (`ICard \| undefined`) |
| `getFusionsWith(id)` | Every fusion this card takes part in |
| `getFusionsFor(resultId)` | How do I make this card? |
| `getRitual(ritualOrResultId)` | Recipe for a ritual |
| `getEquipsFor(monsterId)` / `getEquipTargets(equipId)` | Equip compatibility |
| `getFieldEffect(fieldId)` / `getFieldsAffecting(monsterType)` | Field boosts |
| `getDuelist(id)`, `getDuelistList()`, `getDropsFrom(duelistId)`, `getDroppedBy(cardId)` | Duelists and drops |
| `hasGuardianAdvantage(a, b)` | Guardian-star rule helper (TBD-D11) |

Fusion resolution in FM may involve priority and generic rules (**TBD-D2**). `getFusion` must implement exactly what the agreed model says, and nothing more.

### Q-6 Metadata
```ts
TOTAL_CARDS;                                 // from data/rules.json
MONSTER_TYPES; GUARDIAN_STARS; CARD_TYPES;   // from the schema enums (02 D-4)
getCoverage(): { total: number; entered: number; byType: Record<string, { entered: number; total?: number }> };
```
`byType.total` is known only once we have the full card list per type (TBD).

### Q-7 Optional namespaced entry
Also export `catalog.cards.search(...)`, `catalog.fusions.of(...)` and so on, for discoverability. **TBD-Q2:** add this, or keep flat named exports only (flat exports tree-shake better)?

### Q-8 API docs from code
Write TSDoc on every export and generate the reference with TypeDoc, published with the site at `/docs/api` ([07](./07-site-github-pages-delivery.md)). This replaces the hand-written, outdated API section in the READMEs.

## 5. Acceptance criteria

- [ ] The existing four functions behave exactly as before (regression tests).
- [ ] Every function in Q-3 to Q-6 has unit tests, including empty-data cases.
- [ ] `getCard` is O(1). The site no longer calls it in a loop over hard-coded IDs.
- [ ] Returned collections are `readonly`, and mutation attempts fail in dev/test.
- [ ] The README API section is generated by TypeDoc or links to it.

## 6. TBD / open questions

- **TBD-Q1:** Fuzzy name search (typo-tolerant), and if so, in-house or via a library? It increases bundle size. A simple normalized substring match may be enough.
- **TBD-Q2:** Flat exports only, or a namespaced object as well?
- **TBD-Q3:** Should `searchCards` also search relations (for example, "cards that fuse into Dragons")? Or keep relation queries separate?
- **TBD-Q4:** Localization of `name` and `description` (depends on TBD-X2). If several languages are added, should search take a `locale`?
