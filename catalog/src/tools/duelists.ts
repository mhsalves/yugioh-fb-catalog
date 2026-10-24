import { duelistPools, duelists, imageSources, type PoolPair } from "../data/catalog.generated";
import type { CardId } from "../data/card-types";
import type { IDeckEntry, IDrop, TDropRank } from "../data/duelist-types";
import { DROP_RANKS } from "../data/enums";
import { POOL_WEIGHT_TOTAL } from "../data/rules";
import { getCard } from "./cards";
import type { CardImage } from "./images";

/**
 * Duelists, their decks and their drops (spec 04 Q-5, spec 02 TBD-D9). Weights are out of POOL_WEIGHT_TOTAL (2048);
 * toPercent() turns one into a chance.
 */

/** "weight" (default): most likely first; "attack": strongest monster first, other cards last. */
export type PoolSort = "weight" | "attack";

export interface DuelistListQuery {
    /** Matches the name, case- and accent-insensitive. */
    text?: string;
}

/** A duelist's portrait: a link to the image, its size and where it is hosted (for attribution). */
export type DuelistPortrait = Omit<CardImage, "crop">;

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const attackOf = (card: CardId) => {
    const found = getCard(card);
    return found?.cardType === "Monster" ? found.attack : -1;
};

/** Sorts in place; ties keep the most likely card first, then the lowest card id. */
const sortPool = <T extends { card: CardId; weight: number }>(rows: T[], sort: PoolSort = "weight") =>
    rows.sort(
        (a, b) =>
            (sort === "attack" ? attackOf(b.card) - attackOf(a.card) : 0) || b.weight - a.weight || a.card - b.card,
    );

const entries = (pairs: PoolPair[]) => pairs.map(([card, weight]) => ({ card, weight }));

/** A pool weight as a percentage: 2048 → 100. */
export const toPercent = (weight: number) => (weight * 100) / POOL_WEIGHT_TOTAL;

/** Every duelist, in the game's order (Free Duel, `number` 1-39). */
export const getDuelistList = (query: DuelistListQuery = {}) => {
    const text = normalize(query.text?.trim() ?? "");
    return text ? duelists.filter((duelist) => normalize(duelist.name).includes(text)) : duelists;
};

export const getDuelist = (id: string) => duelists.find((duelist) => duelist.id === id);

/** The cards a duelist's deck is drawn from, with their weights (the deck is rolled from these, not fixed). */
export const getDeckOf = (duelistId: string, options: { sort?: PoolSort } = {}): IDeckEntry[] => {
    const pools = duelistPools[duelistId];
    if (!pools) return [];
    return sortPool(
        entries(pools.deck).map((entry) => ({ duelist: duelistId, ...entry })),
        options.sort,
    );
};

/** The cards a duelist drops, for one rank category or all three. */
export const getDropsFrom = (duelistId: string, options: { rank?: TDropRank; sort?: PoolSort } = {}): IDrop[] => {
    const pools = duelistPools[duelistId];
    if (!pools) return [];
    const ranks = options.rank ? [options.rank] : DROP_RANKS;
    const drops = ranks.flatMap((rank) =>
        entries(pools.drops[rank]).map((entry) => ({ duelist: duelistId, rank, ...entry })),
    );
    return sortPool(drops, options.sort);
};

/** Every duelist and rank that drops a card, most likely first. */
export const getDroppedBy = (cardId: CardId, options: { rank?: TDropRank } = {}): IDrop[] => {
    const ranks = options.rank ? [options.rank] : DROP_RANKS;
    const drops = duelists.flatMap(({ id }) =>
        ranks.flatMap((rank) => {
            const pair = duelistPools[id].drops[rank].find(([card]) => card === cardId);
            return pair ? [{ duelist: id, rank, card: cardId, weight: pair[1] }] : [];
        }),
    );
    return drops.sort((a, b) => b.weight - a.weight);
};

/** Every duelist whose deck can hold a card, most likely first. */
export const getDecksWith = (cardId: CardId): IDeckEntry[] =>
    duelists
        .flatMap(({ id }) => {
            const pair = duelistPools[id].deck.find(([card]) => card === cardId);
            return pair ? [{ duelist: id, card: cardId, weight: pair[1] }] : [];
        })
        .sort((a, b) => b.weight - a.weight);

/** A duelist's portrait (linked from Yugipedia, like the card images), or undefined for an unknown id. */
export const getDuelistPortrait = (id: string): DuelistPortrait | undefined => {
    const duelist = getDuelist(id);
    if (!duelist) return undefined;
    const { portrait } = duelist;
    const source = imageSources[portrait.source];
    const file = decodeURIComponent(portrait.url.split("/").pop()!.split("?")[0]);
    return {
        url: portrait.url,
        width: portrait.width,
        height: portrait.height,
        source: { name: source.name, pageUrl: `${source.filePageUrl}${file}` },
    };
};
