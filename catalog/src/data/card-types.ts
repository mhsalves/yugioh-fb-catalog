import type { CARD_TYPES, GUARDIAN_STARS, MONSTER_TYPES } from "./enums";

/**
 * Types
 * Enumerations are derived from the runtime lists in ./enums (spec 02 D-4).
 */

/** Card Type */
export type TCardType = (typeof CARD_TYPES)[number];
export type TSupportCardType = Exclude<TCardType, "Monster" | "Ritual">;

export type TMonsterType = (typeof MONSTER_TYPES)[number];
export type TGuardianStar = (typeof GUARDIAN_STARS)[number];

/** In-game card number, 1..TOTAL_CARDS */
export type CardId = number;

/** Definitions */
export interface IPassword {
    code: string /** always 8 digits */;
    cost: number /** starchips, range 0-999999 */;
}

// Data type
export interface ICardBase {
    id: CardId;
    name: string;
    password: IPassword;
    description: string;
}

export interface IMonsterCard extends ICardBase {
    cardType: "Monster";
    monsterType: TMonsterType;
    level: number /** Range between 1-12 */;
    attack: number;
    defense: number;
    guardianStars: [TGuardianStar, TGuardianStar];
}

export interface IMagicCard extends ICardBase {
    cardType: "Magic";
}

export interface ITrapCard extends ICardBase {
    cardType: "Trap";
}

export interface IEquipCard extends ICardBase {
    cardType: "Equip";
}

/** The ritual recipe lives in the rituals relation (see IRitual). */
export interface IRitualCard extends ICardBase {
    cardType: "Ritual";
}

export type ISupportCard = IMagicCard | ITrapCard | IEquipCard;

export type ICard = IMonsterCard | IMagicCard | ITrapCard | IEquipCard | IRitualCard;
