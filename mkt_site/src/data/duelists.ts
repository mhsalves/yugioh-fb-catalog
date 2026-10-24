import {
    DROP_RANKS,
    getCard,
    getDeckOf as catalogDeckOf,
    getDropsFrom as catalogDropsFrom,
    getDroppedBy as catalogDroppedBy,
    getDuelist as catalogDuelist,
    getDuelistList as catalogDuelistList,
    getDuelistPortrait,
    toPercent,
    type CardId,
    type DuelistPortrait,
    type ICard,
    type IDuelist,
    type TDropRank,
} from "@mhsalves/yugioh-fm-catalog";

// Adapter over the catalog's duelists (spec 10 F-6): the pages get the card records and percentages they show, and
// the catalog's weights (out of 2048) stay in the catalog.

export { DROP_RANKS };
export type DropRank = TDropRank;

export type RateSort = "rate" | "attack";

export interface DuelistView {
    id: string;
    /** The game's order, 1-39 (Free Duel). */
    number: number;
    name: string;
    portrait?: DuelistPortrait;
}

export interface DropView {
    duelist: DuelistView;
    card: ICard;
    rank: DropRank;
    /** Percent. */
    rate: number;
}

export interface DeckEntryView {
    card: ICard;
    /** Percent. */
    rate: number;
}

const toDuelist = ({ id, number, name }: IDuelist): DuelistView => ({
    id,
    number,
    name,
    portrait: getDuelistPortrait(id),
});

const catalogSort = (sort: RateSort = "rate") => (sort === "attack" ? "attack" : "weight");

function withCards<T extends { card: CardId; weight: number }>(rows: T[]) {
    return rows.flatMap((row) => {
        const card = getCard(row.card);
        return card ? [{ ...row, card, rate: toPercent(row.weight) }] : [];
    });
}

/** Every duelist, in the game's order; `text` matches the name (case- and accent-insensitive). */
export function getDuelistList(query: { text?: string } = {}): DuelistView[] {
    return catalogDuelistList(query).map(toDuelist);
}

export function getDuelist(id: string): DuelistView | undefined {
    const duelist = catalogDuelist(id);
    return duelist && toDuelist(duelist);
}

/** The cards a duelist drops, for one rank or all of them. */
export function getDropsFrom(duelistId: string, options: { rank?: DropRank; sort?: RateSort } = {}): DropView[] {
    const duelist = getDuelist(duelistId);
    if (!duelist) return [];
    return withCards(catalogDropsFrom(duelistId, { rank: options.rank, sort: catalogSort(options.sort) })).map(
        ({ card, rank, rate }) => ({ duelist, card, rank, rate }),
    );
}

/** Every duelist that drops a card, most likely first. */
export function getDroppedBy(cardId: CardId): DropView[] {
    return withCards(catalogDroppedBy(cardId)).flatMap(({ duelist: id, card, rank, rate }) => {
        const duelist = getDuelist(id);
        return duelist ? [{ duelist, card, rank, rate }] : [];
    });
}

/** The cards a duelist's deck is drawn from, with how often each appears. */
export function getDeckOf(duelistId: string, options: { sort?: RateSort } = {}): DeckEntryView[] {
    return withCards(catalogDeckOf(duelistId, { sort: catalogSort(options.sort) })).map(({ card, rate }) => ({
        card,
        rate,
    }));
}
