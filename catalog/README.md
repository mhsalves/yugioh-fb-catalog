# @mhsalves/yugioh-fb-catalog

Card data for **Yu-Gi-Oh! Forbidden Memories** (PlayStation, 1999), with a small typed query API.

- All **722 cards**: 621 monsters, 33 Magic, 34 Equip, 10 Trap and 24 Ritual cards
- All **24 ritual recipes**
- Game rules: guardian star advantages and battle bonus
- Pure, synchronous functions; the data is bundled, so there are no network calls
- TypeScript types included

## Installation

```bash
npm install @mhsalves/yugioh-fb-catalog
# or
yarn add @mhsalves/yugioh-fb-catalog
```

The package is CommonJS and works with both `import` and `require`.

## Quick start

```ts
import { getCard, getCardImage, searchCards, getRitual } from "@mhsalves/yugioh-fb-catalog";

getCard(1);
// {
//   id: 1,
//   name: "Blue-eyes White Dragon",
//   description: "An extremely rare card with unsurpassed attack and defense power.",
//   cardType: "Monster",
//   password: { code: "89631139", cost: 999999 },
//   monsterType: "Dragon",
//   level: 8,
//   attack: 3000,
//   defense: 2500,
//   guardianStars: ["Sun", "Mars"]
// }

// The 3 strongest monsters with "dragon" in the name and ATK 2500 or more
const { total, items } = searchCards({
    text: "dragon",
    cardType: "Monster",
    attack: { min: 2500 },
    sort: { by: "attack", dir: "desc" },
    limit: 3,
});
// total: 7
// items: Blue-eyes Ultimate Dragon (4500), Meteor B. Dragon (3500), B. Skull Dragon (3200)

getRitual(674); // { ritual: 674, result: 365, materials: [186, 261, 595] }
getCardImage(425); // { url: "https://static.wikia.nocookie.net/…", width: 300, height: 423, source }
```

Cards are identified by their **number in the game** (`id`, from 1 to 722). Every function that returns cards returns the catalog's own objects: treat them as read-only.

## API

### Cards

| Function                             | Returns              | Description                                                                             |
| ------------------------------------ | -------------------- | --------------------------------------------------------------------------------------- |
| `getCardList()`                      | `ICard[]`            | Every card, ordered by id.                                                              |
| `getCard(id)`                        | `ICard \| undefined` | The card with that id, or `undefined` if there is none.                                 |
| `getCardsByType(cardType)`           | `ICard[]`            | Every card of one card type: `"Monster"`, `"Magic"`, `"Trap"`, `"Ritual"` or `"Equip"`. |
| `getCardsByMonsterType(monsterType)` | `IMonsterCard[]`     | Every monster of one monster type, such as `"Dragon"` or `"Thunder"`.                   |

```ts
import { getCard, getCardsByType, getCardsByMonsterType } from "@mhsalves/yugioh-fb-catalog";

getCard(425)?.name; // "Thunder Dragon"
getCard(9999); // undefined
getCardsByType("Trap").length; // 10
getCardsByMonsterType("Thunder").length; // 14
```

A card is a union type, so check `cardType` before reading monster fields:

```ts
const card = getCard(425);
if (card?.cardType === "Monster") {
    console.log(card.attack, card.defense, card.guardianStars);
}
```

### `searchCards(query?)`

One function to filter, sort and paginate the whole catalog. Every field of the query is optional, and the fields combine with **AND**. Calling it with no query returns every card.

```ts
searchCards(query?: CardQuery): { total: number; items: readonly ICard[] }
```

| Field                | Type                               | Matches                                                                                                                              |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `text`               | `string`                           | Substring of the name, ignoring case and accents.                                                                                    |
| `includeDescription` | `boolean`                          | Also look for `text` in the description.                                                                                             |
| `cardType`           | `TCardType \| TCardType[]`         | Any of the card types.                                                                                                               |
| `monsterType`        | `TMonsterType \| TMonsterType[]`   | Any of the monster types.                                                                                                            |
| `guardianStar`       | `TGuardianStar \| TGuardianStar[]` | Either of the monster's two guardian stars.                                                                                          |
| `level`              | `{ min?, max? }`                   | Monster level, inclusive.                                                                                                            |
| `attack`             | `{ min?, max? }`                   | Monster ATK, inclusive.                                                                                                              |
| `defense`            | `{ min?, max? }`                   | Monster DEF, inclusive.                                                                                                              |
| `cost`               | `{ min?, max? }`                   | Password cost in starchips, inclusive. Cards without a password are left out.                                                        |
| `ids`                | `number[]`                         | Only these card ids.                                                                                                                 |
| `sort`               | `{ by, dir? }`                     | `by`: `"id"`, `"name"`, `"attack"`, `"defense"`, `"level"` or `"cost"`. `dir`: `"asc"` (default) or `"desc"`. Default: id ascending. |
| `limit`              | `number`                           | At most this many items.                                                                                                             |
| `offset`             | `number`                           | Skip this many items first.                                                                                                          |

- A list field matches **any** of its values; an empty list is the same as leaving the field out.
- `monsterType`, `guardianStar`, `level`, `attack` and `defense` only exist on monsters, so setting any of them leaves the other card types out.
- When sorting by a value a card does not have (a monster stat on a Magic card, `cost` on a card without a password), that card comes last. Ties are broken by id.
- `total` is the number of matches **before** `limit` and `offset`, so you can paginate:

```ts
const pageSize = 20;
const page = (n: number) =>
    searchCards({ cardType: "Magic", sort: { by: "name" }, limit: pageSize, offset: n * pageSize });

const { total, items } = page(0); // total: 33, items: the first 20 Magic cards by name
```

More examples:

```ts
// Sun or Moon monsters of level 4 or less
searchCards({ guardianStar: ["Sun", "Moon"], level: { max: 4 } });

// Cheapest cards you can buy with a password
searchCards({ cost: { max: 100 }, sort: { by: "cost" } });

// Cards that mention "dragon" in the name or the description
searchCards({ text: "dragon", includeDescription: true });
```

### Rituals

`getRitual(id)` returns the recipe of a ritual. You can look it up by the id of the **ritual card** or by the id of the **monster it summons**. It returns `undefined` when neither matches.

```ts
import { getRitual, getCard } from "@mhsalves/yugioh-fb-catalog";

getRitual(674); // { ritual: 674, result: 365, materials: [186, 261, 595] }
getRitual(365); // the same recipe, found by the summoned monster

const recipe = getRitual(674);
recipe?.materials.map((id) => getCard(id)?.name); // the monsters to sacrifice
```

### Card images

The package ships **links only, no images**. Every card has one: 618 are the card scans of the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) (Fandom), about 300 × 423 px. The other 104 cards only have the card back there, so they link [Yugipedia](https://yugipedia.com/)'s screenshot of the game's card screen (320 × 240), with the `crop` that is the card.

| Function                   | Returns                   | Description                                                                                  |
| -------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `getCardImage(id, size?)`  | `CardImage \| undefined`  | `size`: `"full"` (default) or `"thumb"` (160 px wide, from Fandom's CDN).                    |
| `getCardImageSrcSet(id)`   | `string \| undefined`     | A `srcset` with the thumbnail and the full image. `undefined` for cropped images.            |

```ts
import { getCardImage } from "@mhsalves/yugioh-fb-catalog";

getCardImage(425, "thumb");
// {
//   url: "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest/scale-to-width-down/160?cb=20131221161931",
//   width: 160, height: 226,
//   source: { name: "Yu-Gi-Oh! Wiki (Fandom)", pageUrl: "https://yugioh.fandom.com/wiki/File:ThunderDragon-FMR-EN-VG.png" }
// }

getCardImage(580);
// {
//   url: "https://ms.yugipedia.com/e/ee/PatrolRobo-FMR-NA-VG.png", width: 320, height: 240,
//   crop: { x: 4, y: 6, width: 136, height: 192 },   // show only this part: the card
//   source: { name: "Yugipedia", pageUrl: "https://yugipedia.com/wiki/File:PatrolRobo-FMR-NA-VG.png" }
// }
```

- **When `crop` is set**, show only that rectangle, for example with a wrapper that has `overflow: hidden` and the crop's aspect ratio, and the image scaled and moved inside it.
- **Fandom's CDN answers 403 without a `Referer`.** Web pages send one by default, so do not set `referrerpolicy="no-referrer"`. Servers, CLIs and apps that download the images must send their own.
- **Credit the source** with `source.name` and a link to `source.pageUrl`. Yu-Gi-Oh! and its card artwork are © Kazuki Takahashi / Konami.
- The images are captures of a PS1 game and look dull. The [site](https://mhsalves.github.io/yugioh-fb-catalog) lifts them with CSS: `filter: contrast(1.2) saturate(1.25) brightness(1.05)`.

### Constants

| Constant                  | Value                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TOTAL_CARDS`             | `722`, the number of cards in the game.                                                                                                                                                                                                                                                                     |
| `CARD_TYPES`              | `["Monster", "Magic", "Trap", "Ritual", "Equip"]`                                                                                                                                                                                                                                                           |
| `MONSTER_TYPES`           | The 20 monster types, in the game's order: `"Dragon"`, `"Spellcaster"`, `"Zombie"`, `"Warrior"`, `"Beast-Warrior"`, `"Beast"`, `"Winged Beast"`, `"Fiend"`, `"Fairy"`, `"Insect"`, `"Dinosaur"`, `"Reptile"`, `"Fish"`, `"Sea Serpent"`, `"Machine"`, `"Thunder"`, `"Aqua"`, `"Pyro"`, `"Rock"`, `"Plant"`. |
| `GUARDIAN_STARS`          | The 10 guardian stars: `"Mars"`, `"Jupiter"`, `"Saturn"`, `"Uranus"`, `"Pluto"`, `"Neptune"`, `"Mercury"`, `"Sun"`, `"Moon"`, `"Venus"`.                                                                                                                                                                    |
| `GUARDIAN_STAR_ADVANTAGE` | The star each guardian star has the advantage over, such as `GUARDIAN_STAR_ADVANTAGE.Sun === "Moon"`.                                                                                                                                                                                                       |
| `GUARDIAN_STAR_BONUS`     | `500`. In battle, the card with the advantage gets +500 ATK/DEF and the other card -500.                                                                                                                                                                                                                    |

The guardian star advantages form two cycles that never interact:

- Mars → Jupiter → Saturn → Uranus → Pluto → Neptune → Mars
- Sun → Moon → Venus → Mercury → Sun

The lists are useful to build filters and menus:

```ts
import { MONSTER_TYPES, getCardsByMonsterType } from "@mhsalves/yugioh-fb-catalog";

const countByType = MONSTER_TYPES.map((type) => [type, getCardsByMonsterType(type).length]);
```

## Types

All types are exported:

```ts
import type { ICard, IMonsterCard, CardQuery, TMonsterType } from "@mhsalves/yugioh-fb-catalog";
```

### Cards

```ts
type CardId = number; // 1 to 722

interface ICardBase {
    id: CardId;
    name: string;
    description: string;
    password?: { code: string; cost: number }; // code: 8 digits; cost: starchips
}

interface IMonsterCard extends ICardBase {
    cardType: "Monster";
    monsterType: TMonsterType;
    level: number; // 1 to 12
    attack: number;
    defense: number;
    guardianStars: [TGuardianStar, TGuardianStar];
}

interface IMagicCard extends ICardBase {
    cardType: "Magic";
}
interface ITrapCard extends ICardBase {
    cardType: "Trap";
}
interface IEquipCard extends ICardBase {
    cardType: "Equip";
}
interface IRitualCard extends ICardBase {
    cardType: "Ritual";
} // recipe: getRitual()

type ICard = IMonsterCard | IMagicCard | ITrapCard | IEquipCard | IRitualCard;
type ISupportCard = IMagicCard | ITrapCard | IEquipCard;
```

`password` is `undefined` for the 24 cards the game gives no password: ritual results and story cards, such as 364, 380 and 701 to 722. Read it as `card.password?.code`.

### Enumerations

```ts
type TCardType = "Monster" | "Magic" | "Trap" | "Ritual" | "Equip"; // CARD_TYPES
type TSupportCardType = "Magic" | "Trap" | "Equip";
type TMonsterType = (typeof MONSTER_TYPES)[number];
type TGuardianStar = (typeof GUARDIAN_STARS)[number];
```

### Search and rituals

```ts
interface NumberRange {
    min?: number;
    max?: number;
} // inclusive; a missing side means no limit
type CardSortKey = "id" | "name" | "attack" | "defense" | "level" | "cost";
interface CardQuery {
    /* see searchCards */
}
interface CardSearchResult {
    total: number;
    items: readonly ICard[];
}

interface IRitual {
    ritual: CardId;
    result: CardId;
    materials: CardId[];
}
interface IGameRules {
    totalCards: number;
    guardianStarAdvantage: Record<TGuardianStar, TGuardianStar>;
    guardianStarBonus: number;
}
```

### Images

```ts
type ImageSize = "thumb" | "full";
interface CardImage {
    url: string;
    width: number; // size of the image at url
    height: number;
    crop?: IImageCrop; // the part of the image that is the card
    source: { name: string; pageUrl: string };
}
interface IImageCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

`ICardImageRef` and `IImageSource` (the stored records) and the constants `THUMB_WIDTH` (`160`) and `DEFAULT_IMAGE_SIZE` (`{ width: 300, height: 423 }`) are exported too.

`IFusion`, `IEquipCompat` and `IFieldEffect` are also exported, but the catalog has no fusion, equip or field data yet, so there are no functions that return them.

## Data accuracy

The cards come from the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/wiki/List_of_Yu-Gi-Oh!_Forbidden_Memories_cards) and were checked against two dumps of the game data. Where the wiki is wrong, the catalog follows the game; the corrected cards are listed in the [CHANGELOG](https://github.com/mhsalves/yugioh-fb-catalog/blob/main/catalog/CHANGELOG.md). Found a wrong value? [Open an issue](https://github.com/mhsalves/yugioh-fb-catalog/issues).

## Versioning

The package is in `0.x`: a minor version may contain breaking changes, marked **BREAKING** in the [CHANGELOG](https://github.com/mhsalves/yugioh-fb-catalog/blob/main/catalog/CHANGELOG.md), with migration notes.

## Contributing

How the data is organized, how to add or fix a card and how to sync with the wiki: [catalog/docs/DATA.md](https://github.com/mhsalves/yugioh-fb-catalog/blob/main/catalog/docs/DATA.md) (in Portuguese).

## License

Code: MIT.

Card data comes from the [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) (Fandom), whose text is licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Card names and texts are from the game, © Konami. Card images are not included: the package links images hosted by the Yu-Gi-Oh! Wiki (Fandom) and Yugipedia; the artwork is © Kazuki Takahashi / Konami. This project is not affiliated with Konami.
