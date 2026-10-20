import type { CardId, TMonsterType } from "./card-types";

/**
 * Relations between cards (spec 02 D-1, D-3). Cards describe what a card is; these collections
 * describe the game mechanics that link cards, keyed by card id.
 */

/**
 * One fusion, as the game stores it: a specific pair of cards and its result.
 * Order-insensitive: materials are sorted ascending (a <= b); a card may fuse with itself.
 * "Generic" fusions (such as Dragon + Thunder) are a summary of these pairs and are not stored.
 */
export interface IFusion {
    materials: [CardId, CardId];
    result: CardId;
}

/** Ritual recipe: the ritual card, the monster it summons and the monsters it sacrifices. */
export interface IRitual {
    ritual: CardId;
    result: CardId;
    materials: CardId[];
}

/** Which monsters an equip card can target, and its boost to ATK and DEF (values: TBD-D8). */
export interface IEquipCompat {
    equip: CardId;
    targets: CardId[];
    boost: number;
}

/** A field magic card's effect on monster types (amounts: TBD-D8). */
export interface IFieldEffect {
    field: CardId;
    boosts: TMonsterType[];
    weakens: TMonsterType[];
    amount: number;
}

// Duelists, deck pools and drops wait for TBD-D9 (duelist list, rank categories, weights vs percentages).
