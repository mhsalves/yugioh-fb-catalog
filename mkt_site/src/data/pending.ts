import type { RouteId } from "../routes";

/**
 * Catalog methods the site needs but the catalog does not have yet (spec 10 F-6). The site mocks each one in
 * src/data/ with the signature planned for the catalog, so the screens can be built and reviewed now. Spec 04 Q-5
 * lists the same methods.
 *
 * When the catalog ships one: re-export it from its adapter in src/data/, delete the mock and its entry here,
 * update spec 04 Q-5, and set the feature's route to "live" in routes.ts once all of its methods are real.
 */
export interface PendingMethod {
    name: string;
    /** The signature the site codes against (the catalog may refine it). */
    signature: string;
    /** Where it is specified. */
    spec: string;
    /** What the mock answers with meanwhile. */
    mock: "sample data" | "real data, computed in the site";
    /** Pages that call it. */
    usedBy: RouteId[];
}

export const PENDING_CATALOG_METHODS: readonly PendingMethod[] = [
    {
        name: "getFusion",
        signature: "getFusion(a: CardId, b: CardId): ICard | undefined",
        spec: "04 Q-5",
        mock: "sample data",
        usedBy: ["fusion"],
    },
    {
        name: "getFusionsWith",
        signature: "getFusionsWith(id: CardId): IFusion[]",
        spec: "04 Q-5",
        mock: "sample data",
        usedBy: ["fusion", "cards"],
    },
    {
        name: "getFusionsFor",
        signature: "getFusionsFor(resultId: CardId): IFusion[]",
        spec: "04 Q-5",
        mock: "sample data",
        usedBy: ["fusion", "cards"],
    },
    {
        name: "getDuelistList",
        signature: "getDuelistList(query?: { text?: string }): IDuelist[]",
        spec: "04 Q-5, 02 D-3 (TBD-D9)",
        mock: "sample data",
        usedBy: ["duelists"],
    },
    {
        name: "getDuelist",
        signature: "getDuelist(id: string): IDuelist | undefined",
        spec: "04 Q-5, 02 D-3 (TBD-D9)",
        mock: "sample data",
        usedBy: ["duelists"],
    },
    {
        name: "getDropsFrom",
        signature: 'getDropsFrom(duelistId: string, options?: { rank?: TDropRank; sort?: "rate" | "attack" }): IDrop[]',
        spec: "04 Q-5, 02 D-3 (TBD-D9)",
        mock: "sample data",
        usedBy: ["duelists"],
    },
    {
        name: "getDroppedBy",
        signature: "getDroppedBy(cardId: CardId): IDrop[]",
        spec: "04 Q-5, 02 D-3 (TBD-D9)",
        mock: "sample data",
        usedBy: ["duelists", "cards"],
    },
    {
        name: "getDeckOf",
        signature: 'getDeckOf(duelistId: string, options?: { sort?: "rate" | "attack" }): IDeckEntry[]',
        spec: "New, proposed in 10 F-9",
        mock: "sample data",
        usedBy: ["duelists"],
    },
    {
        name: "getCardByPassword",
        signature: "getCardByPassword(code: string): ICard | undefined",
        spec: "New, proposed in 10 F-7",
        mock: "real data, computed in the site",
        usedBy: ["search"],
    },
];

export const pendingFor = (route: RouteId) => PENDING_CATALOG_METHODS.filter((method) => method.usedBy.includes(route));
