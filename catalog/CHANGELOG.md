# Changelog

All notable changes to `@mhsalves/yugioh-fb-catalog`. The package is in `0.x`: a minor version may contain breaking changes, which are marked **BREAKING**.

## 0.3.0

### Added

- `searchCards(query)`: one query function for the whole catalog (spec 04 Q-4). Every field of `CardQuery` is optional and fields combine with AND: `text` (case- and accent-insensitive name match, plus the description with `includeDescription`), `cardType`, `monsterType`, `guardianStar` (one value or a list), `level`, `attack`, `defense`, `cost` ranges (`{ min?, max? }`), `ids`, `sort` (`id`, `name`, `attack`, `defense`, `level`, `cost`; `asc` or `desc`), `limit` and `offset`. Returns `{ total, items }`.
- Types `CardQuery`, `NumberRange`, `CardSortKey` and `CardSearchResult`.

```ts
searchCards({ cardType: "Monster", guardianStar: ["Sun", "Moon"], attack: { min: 1500 }, sort: { by: "attack", dir: "desc" } });
```

Monster-only filters (`monsterType`, `guardianStar`, `level`, `attack`, `defense`) leave the other card types out while they are set. When sorting by a monster stat, cards without it come last.

## 0.2.0

Data model update (spec 02, `docs/specs/02-catalog-data-model.md`). The data is now authored as JSON validated by schemas (spec 03); the data itself and the public API are the same either way.

### BREAKING

- **Monster points are flat fields.** `monsterPoints.attack` / `monsterPoints.defense` → `attack` / `defense`.
- **Guardian stars are a tuple.** `guardianStars.first` / `guardianStars.second` → `guardianStars[0]` / `guardianStars[1]`.
- **Ritual recipes moved out of the card.** `IRitualCard.summon` is removed. Use `getRitual(ritualOrResultId)`, which returns `{ ritual, result, materials }`:
  - `summon.monsterResultId` → `getRitual(id)?.result`
  - `summon.monsterMaterialIds` → `getRitual(id)?.materials`
- **`ISupportCard` is now a union** of the new `IMagicCard`, `ITrapCard` and `IEquipCard` (narrow on `cardType`).
- **Type renames:** `TGuardianStars` → `TGuardianStar`. `IMonsterPoints`, `IGuardianStarsOptions` and `IRitualSummon` are removed.

Migration example:

```ts
// 0.1.x
const { attack } = card.monsterPoints;
const firstStar = card.guardianStars.first;
const result = ritualCard.summon.monsterResultId;

// 0.2.0
const { attack } = card;
const [firstStar] = card.guardianStars;
const result = getRitual(ritualCard.id)?.result;
```

### Added

- `TMonsterType` lists all 20 monster types of the game (was `"Thunder" | "Dragon"`).
- Runtime lists `MONSTER_TYPES`, `CARD_TYPES` and `GUARDIAN_STARS`; the TS types are derived from them.
- Game rules: `TOTAL_CARDS` (722), `GUARDIAN_STAR_ADVANTAGE` and `GUARDIAN_STAR_BONUS` (500).
- `getRitual(ritualOrResultId)`.
- Relation types `IFusion`, `IRitual`, `IEquipCompat`, `IFieldEffect`, and the `CardId` alias.

### Changed

- `getCardsByMonsterType` returns `IMonsterCard[]` (was `ICard[]`).
- The card data and the game rules are stored as JSON in the repository (`catalog/data/`) and validated before every build. The package still ships compiled JS, so consumers see no difference. `TOTAL_CARDS` is typed `number` (its value is still 722).

## 0.1.1

First published version: 5 cards and `getCardList`, `getCard`, `getCardsByType`, `getCardsByMonsterType`.
