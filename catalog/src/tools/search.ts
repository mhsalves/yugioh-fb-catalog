import { cards } from "../data/catalog.generated";
import type { CardId, ICard, IMonsterCard, TCardType, TGuardianStar, TMonsterType } from "../data/card-types";

/** Inclusive bounds; a missing side means no limit. */
export interface NumberRange {
    min?: number;
    max?: number;
}

export type CardSortKey = "id" | "name" | "attack" | "defense" | "level" | "cost";

/**
 * Filters for searchCards (spec 04 Q-4). Every field is optional and fields combine with AND.
 * A list field matches any of its values; an empty list is the same as leaving it out.
 * monsterType, guardianStar, level, attack and defense only exist on monsters, so setting any of
 * them leaves the other card types out of the results.
 */
export interface CardQuery {
    /** Case- and accent-insensitive substring of the name (and of the description with includeDescription). */
    text?: string;
    includeDescription?: boolean;
    cardType?: TCardType | TCardType[];
    monsterType?: TMonsterType | TMonsterType[];
    /** Matches either of the monster's two guardian stars. */
    guardianStar?: TGuardianStar | TGuardianStar[];
    level?: NumberRange;
    attack?: NumberRange;
    defense?: NumberRange;
    /** Password cost in starchips. */
    cost?: NumberRange;
    ids?: CardId[];
    /** Default: id ascending. Cards without the sort value (non-monsters for monster stats) go last. */
    sort?: { by: CardSortKey; dir?: "asc" | "desc" };
    limit?: number;
    offset?: number;
}

export interface CardSearchResult {
    /** Matches before limit and offset are applied. */
    total: number;
    items: readonly ICard[];
}

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const toList = <T>(value: T | T[] | undefined): T[] =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

const isSet = (range?: NumberRange) => range !== undefined && (range.min !== undefined || range.max !== undefined);

const inRange = (value: number, range?: NumberRange) =>
    range === undefined ||
    ((range.min === undefined || value >= range.min) && (range.max === undefined || value <= range.max));

const isMonster = (card: ICard): card is IMonsterCard => card.cardType === "Monster";

const sortValue = (card: ICard, by: CardSortKey): number | string | undefined => {
    switch (by) {
        case "id":
            return card.id;
        case "name":
            return card.name;
        case "cost":
            return card.password.cost;
        default:
            return isMonster(card) ? card[by] : undefined;
    }
};

/** Searches the catalog with one query object (spec 04 Q-4). Pure and synchronous. */
export function searchCards(query: CardQuery = {}): CardSearchResult {
    const text = normalize(query.text?.trim() ?? "");
    const cardTypes = toList(query.cardType);
    const monsterTypes = toList(query.monsterType);
    const stars = toList(query.guardianStar);
    const ids = query.ids && query.ids.length > 0 ? new Set(query.ids) : undefined;
    const monsterOnly =
        monsterTypes.length > 0 ||
        stars.length > 0 ||
        isSet(query.level) ||
        isSet(query.attack) ||
        isSet(query.defense);

    const matches = cards.filter((card) => {
        if (ids && !ids.has(card.id)) return false;
        if (cardTypes.length > 0 && !cardTypes.includes(card.cardType)) return false;
        if (!inRange(card.password.cost, query.cost)) return false;
        if (text) {
            const haystack = query.includeDescription ? `${card.name}\n${card.description}` : card.name;
            if (!normalize(haystack).includes(text)) return false;
        }
        if (!monsterOnly) return true;
        if (!isMonster(card)) return false;
        return (
            (monsterTypes.length === 0 || monsterTypes.includes(card.monsterType)) &&
            (stars.length === 0 || card.guardianStars.some((star) => stars.includes(star))) &&
            inRange(card.level, query.level) &&
            inRange(card.attack, query.attack) &&
            inRange(card.defense, query.defense)
        );
    });

    const by = query.sort?.by ?? "id";
    const sign = query.sort?.dir === "desc" ? -1 : 1;
    const sorted = [...matches].sort((a, b) => {
        const va = sortValue(a, by);
        const vb = sortValue(b, by);
        if (va === undefined || vb === undefined) {
            if (va !== vb) return va === undefined ? 1 : -1;
        } else if (va !== vb) {
            const order = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
            return sign * order;
        }
        return a.id - b.id;
    });

    const offset = query.offset ?? 0;
    const items = query.limit === undefined ? sorted.slice(offset) : sorted.slice(offset, offset + query.limit);
    return { total: matches.length, items };
}
