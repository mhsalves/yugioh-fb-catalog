# Changelog

All notable changes to `@mhsalves/yugioh-fm-catalog`. The package is in `0.x`: a minor version may contain breaking changes, which are marked **BREAKING**.

## 0.7.0

### Added

- **Duelists, their decks and their drops** (spec 02 TBD-D9): the 39 Free Duel opponents, each with the pool their deck is drawn from and the three drop pools (`"S/A-POW"`, `"B/C/D"`, `"S/A-TEC"`). Pools are weights out of 2048, as the game stores them. One file per duelist in `catalog/data/duelists/<id>.json`, validated by the new `duelist` schema (every pool must add up to 2048).
- `getDuelistList(query?)`, `getDuelist(id)`, `getDropsFrom(id, options?)`, `getDeckOf(id, options?)`, `getDroppedBy(cardId, options?)`, `getDecksWith(cardId)`, `getDuelistPortrait(id)` and `toPercent(weight)`.
- **Duelist portraits** as links to [Yugipedia](https://yugipedia.com/) (`Portal:Yu-Gi-Oh! Forbidden Memories characters`), like the card images: no images are shipped. Rematches (Jono 2nd, Teana 2nd, Seto 2nd and 3rd, Heishin 2nd) use the same portrait as the first duel.
- Constants `DROP_RANKS` and `POOL_WEIGHT_TOTAL` (`2048`, also `poolWeightTotal` in `rules.json` and `IGameRules`), and the types `IDuelist`, `IDuelistPortraitRef`, `IPoolEntry`, `IDeckEntry`, `IDrop`, `IDuelistPools`, `TDropRank`, `PoolSort`, `DuelistListQuery` and `DuelistPortrait`.

The 12,518 weights come from the game's drop tables as dumped from the disc by the [decompilation](https://github.com/Unchiga/Yu-Gi-Oh-Forbidden-Memories-Recompiled) (`notes/research/fusion-and-drop-tables/drops.csv`). For duelists 1 to 38 they match GenericMadScientist's FmDatabase (via [YFM-Database-and-Fusion-Guide](https://github.com/MarceloSilvarolla/YFM-Database-and-Fusion-Guide)) weight for weight; Duel Master K's drops match yugiohfm.com's rates. As the game data shows, Heishin 2nd shares Heishin's drop pools and Duel Master K shares Villager 3's, with decks of their own.

## 0.6.0

### Changed

- **Renamed** from `@mhsalves/yugioh-fb-catalog` to `@mhsalves/yugioh-fm-catalog` ("FM" for Forbidden Memories). The API and data are the same as 0.5.0. To migrate, install the new name and update your imports; the old package is deprecated and stays at 0.5.0.

## 0.5.0

### Added

- **Card images for all 722 cards** (spec 08), as links: the package ships URLs, never images. `catalog/data/images.json` holds 618 images from the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) (Fandom) and, for the 104 cards Fandom only shows the card back for, Yugipedia's screenshots of the game's card screen with the `crop` that is the card. `yarn data:sync` fills it.
- `getCardImage(id, size?)`: `{ url, width, height, crop?, source: { name, pageUrl } }`, or `undefined`. `size` is `"full"` (default) or `"thumb"` (160 px, from Fandom's CDN). When `crop` is set, show only that rectangle of the image.
- `getCardImageSrcSet(id)`: a `srcset` with the thumbnail and the full image (`undefined` for cropped images).
- Types `ImageSize`, `CardImage`, `ICardImageRef`, `IImageSource`, `IImageCrop`, and the constants `THUMB_WIDTH` and `DEFAULT_IMAGE_SIZE`.

Fandom's CDN answers **403 without a `Referer`**. Web pages send one by default (do not set `referrerpolicy="no-referrer"`); servers, CLIs and apps that download the images must send their own. Yu-Gi-Oh! and its card artwork are © Kazuki Takahashi / Konami.

## 0.4.1

### Changed

- **New README** for the npm page: installation, every function, constant and type, with examples. No code or data changes.

## 0.4.0

### BREAKING

- **`password` is optional.** The 24 cards the game gives no password (ritual results and story cards, such as 364 Black Luster Soldier, 380 Blue-eyes Ultimate Dragon and 701–722) have none, so `card.password` is `undefined` for them. Read it as `card.password?.code` / `card.password?.cost`.
- `searchCards({ cost })` leaves cards without a password out while a cost range is set, and sorting by `cost` puts them last.

### Added

- **All 722 cards** (was 5): 621 monsters across all 20 monster types, 33 Magic, 34 Equip, 10 Trap and 24 Ritual cards, imported from the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) with `yarn data:sync` (spec 03 A-5). The wiki's text is CC BY-SA 3.0; see the attribution in the README.
- **24 ritual recipes** (was 1) in `getRitual()`, one for every ritual card.

Every card was checked against two dumps of the game data ([FusionCalc](https://github.com/Solumin/YGO-FM-FusionCalc) `Cards.json` and the [decompilation](https://github.com/Unchiga/Yu-Gi-Oh-Forbidden-Memories-Recompiled)'s `card-catalog.csv`, spec 02 §6). Where both disagree with the wiki, the catalog follows the game: 15 cards (213, 285, 393, 402, 430, 436, 456, 473, 493, 500, 534, 580, 606, 637, 678), for example 580 Patrol Robo DEF 900 (wiki: 1900) and 430 Water Magician as Aqua (wiki: Spellcaster).

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
