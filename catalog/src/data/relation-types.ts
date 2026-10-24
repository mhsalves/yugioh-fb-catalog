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

/** A host the card images are linked from (spec 08 I-2), keyed by id in images.json `sources`. */
export interface IImageSource {
    name: string;
    /** Prefix of an image's file page: append the file name (for attribution, spec 08 I-5). */
    filePageUrl: string;
}

/** The part of an image that shows the card, in the image's own pixels. */
export interface IImageCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * A card's image, as a link to an image the source hosts: the catalog ships URLs, never images (spec 08 I-1).
 * `url` is the full-size image exactly as the wiki gives it (Fandom's `?cb=` revision included), and
 * `width`/`height` its size. `crop` is set when the image shows more than the card, such as
 * Yugipedia's screenshots of the game's card screen: only that rectangle is the card.
 */
export interface ICardImageRef {
    card: CardId;
    source: string;
    url: string;
    width?: number;
    height?: number;
    crop?: IImageCrop;
}

// Duelists, deck pools and drops wait for TBD-D9 (duelist list, rank categories, weights vs percentages).
