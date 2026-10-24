import { getCard, type CardId, type ICard } from "@mhsalves/yugioh-fm-catalog";
import { SAMPLE_DROP_RANKS, sampleDuelists, type SampleDuelist } from "./sample";

// MOCK (spec 10 F-6, listed in ./pending.ts): the catalog has no duelists, decks or drops yet (spec 02 TBD-D9). These
// functions keep the signatures planned for the catalog (02 D-3's draft IDuelist, IDeckEntry, IDrop) and answer from
// sample data. When the catalog ships them, re-export them from here and delete the mock.

/** Drop rank categories from spec 02's draft; the final list waits for TBD-D9. */
export const DROP_RANKS = SAMPLE_DROP_RANKS;
export type DropRank = (typeof DROP_RANKS)[number];

export type RateSort = "rate" | "attack";

export interface DuelistView {
    id: string;
    name: string;
    stage: string;
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

const toDuelist = ({ id, name, stage }: SampleDuelist): DuelistView => ({ id, name, stage });

const attackOf = (card: ICard) => (card.cardType === "Monster" ? card.attack : -1);

function sortRates<T extends { card: ICard; rate: number }>(rows: T[], sort: RateSort = "rate"): T[] {
    return rows.sort((a, b) => (sort === "attack" ? attackOf(b.card) - attackOf(a.card) : b.rate - a.rate));
}

function withCards<T extends { card: CardId; rate: number }>(rows: T[]) {
    return rows.flatMap((row) => {
        const card = getCard(row.card);
        return card ? [{ ...row, card }] : [];
    });
}

/** Every duelist, in campaign order; `text` matches the name (case- and accent-insensitive). */
export function getDuelistList(query: { text?: string } = {}): DuelistView[] {
    const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const text = normalize(query.text?.trim() ?? "");
    return sampleDuelists()
        .filter((duelist) => normalize(duelist.name).includes(text))
        .map(toDuelist);
}

export function getDuelist(id: string): DuelistView | undefined {
    const duelist = sampleDuelists().find((item) => item.id === id);
    return duelist && toDuelist(duelist);
}

/** The cards a duelist drops, for one rank or all of them. */
export function getDropsFrom(duelistId: string, options: { rank?: DropRank; sort?: RateSort } = {}): DropView[] {
    const duelist = sampleDuelists().find((item) => item.id === duelistId);
    if (!duelist) return [];
    const ranks = options.rank ? [options.rank] : DROP_RANKS;
    const rows = ranks.flatMap((rank) =>
        withCards(duelist.drops[rank]).map((row) => ({ ...row, rank, duelist: toDuelist(duelist) })),
    );
    return sortRates(rows, options.sort);
}

/** Every duelist that drops a card, most likely first. */
export function getDroppedBy(cardId: CardId): DropView[] {
    return sortRates(
        sampleDuelists().flatMap((duelist) => getDropsFrom(duelist.id).filter((drop) => drop.card.id === cardId)),
    );
}

/** The cards a duelist's deck is drawn from, with how often each appears. */
export function getDeckOf(duelistId: string, options: { sort?: RateSort } = {}): DeckEntryView[] {
    const duelist = sampleDuelists().find((item) => item.id === duelistId);
    return duelist ? sortRates(withCards(duelist.deck), options.sort) : [];
}
