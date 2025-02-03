/**
 * Types
 */

/** Card Type */
export type TSupportCardType = "Equip" | "Magic" | "Trap";
export type TCardType = TSupportCardType | "Monster" | "Ritual";

export type TMonsterType = "Thunder" | "Dragon";
export type TGuardianStars = "Sun" | "Mercury" | "Venus" | "Moon" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

/** Definitions */
export interface IPassword {
    code: string; /** always 8 digits */
    cost: number; /** Range between 0-999999 */
}

/** Monster definitions */
export interface IMonsterPoints {
    attack: number;
    defense: number;
}

export interface IGuardianStarsOptions {
    first: TGuardianStars;
    second: TGuardianStars;
}

export interface IRitualSummon {
    monsterResultId: number;
    monsterMaterialIds: number[];
}

// Data type
interface ICardBase {
    id: number;
    name: string;
    password: IPassword;
    description: string;
}

export interface ISupportCard extends ICardBase {
    cardType: TSupportCardType;
};

export interface IRitualCard extends ICardBase {
    cardType: "Ritual";
    summon: IRitualSummon;
};

export interface IMonsterCard extends ICardBase {
    cardType: "Monster";
    level: number; /** Range betweeen 1-12 */
    monsterType: TMonsterType;
    monsterPoints: IMonsterPoints;
    guardianStars: IGuardianStarsOptions;
};

export type ICard = ISupportCard | IRitualCard | IMonsterCard;
