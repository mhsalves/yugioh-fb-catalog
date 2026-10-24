import type { CardId } from "./card-types";
import type { DROP_RANKS } from "./enums";

/**
 * Duelists, their deck pools and their drop pools (spec 02 D-3, TBD-D9). Pools are weighted as the game stores
 * them: each pool's weights add up to POOL_WEIGHT_TOTAL (2048), and a card's chance is its weight / 2048.
 */

/** Drop rank category: "S/A-POW", "B/C/D" or "S/A-TEC". */
export type TDropRank = (typeof DROP_RANKS)[number];

/** A card in a pool and its weight, out of POOL_WEIGHT_TOTAL. */
export interface IPoolEntry {
    card: CardId;
    weight: number;
}

/** A duelist's portrait, as a link to an image the source hosts (like card images, spec 08 I-1). */
export interface IDuelistPortraitRef {
    source: string;
    url: string;
    width: number;
    height: number;
}

/** One Free Duel opponent. `id` is a URL-safe slug ("simon-muran"); `number` is the game's order (1-39). */
export interface IDuelist {
    id: string;
    number: number;
    name: string;
    portrait: IDuelistPortraitRef;
}

/** A card the duelist's deck is drawn from (the deck is rolled from these weights, not fixed). */
export interface IDeckEntry extends IPoolEntry {
    duelist: string;
}

/** A card the duelist can give after a won duel, for one rank category. */
export interface IDrop extends IPoolEntry {
    duelist: string;
    rank: TDropRank;
}

/** A duelist's four pools, as stored in catalog/data/duelists/<id>.json. */
export interface IDuelistPools {
    deck: IPoolEntry[];
    drops: Record<TDropRank, IPoolEntry[]>;
}
