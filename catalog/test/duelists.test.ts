import { describe, expect, it } from "vitest";

import {
    DROP_RANKS,
    POOL_WEIGHT_TOTAL,
    getCard,
    getDeckOf,
    getDecksWith,
    getDroppedBy,
    getDropsFrom,
    getDuelist,
    getDuelistList,
    getDuelistPortrait,
    toPercent,
} from "../src";

/**
 * The duelist API on the real data. Expected values come from the game's drop tables as dumped from the disc
 * ([Decomp] notes/research/fusion-and-drop-tables/drops.csv, spec 02 §6).
 */

const weights = (rows: { card: number; weight: number }[]) => rows.map(({ card, weight }) => [card, weight]);

describe("duelists", () => {
    it("lists the 39 Free Duel opponents in the game's order", () => {
        const list = getDuelistList();
        expect(list).toHaveLength(39);
        expect(list.map((duelist) => duelist.number)).toEqual(Array.from({ length: 39 }, (_, index) => index + 1));
        expect(list[0]).toMatchObject({ id: "simon-muran", name: "Simon Muran" });
        expect(list[38]).toMatchObject({ id: "duel-master-k", name: "Duel Master K" });
    });

    it("filters by name, case- and accent-insensitive", () => {
        expect(getDuelistList({ text: "MAGE" }).map((duelist) => duelist.id)).toContain("high-mage-secmeton");
        expect(getDuelistList({ text: "sétó" }).map((duelist) => duelist.id)).toEqual(["seto", "seto-2nd", "seto-3rd"]);
        expect(getDuelistList({ text: "nobody" })).toEqual([]);
    });

    it("finds a duelist by id", () => {
        expect(getDuelist("heishin")?.number).toBe(8);
        expect(getDuelist("nobody")).toBeUndefined();
    });

    it("has every pool adding up to POOL_WEIGHT_TOTAL, with every card in the catalog", () => {
        expect(POOL_WEIGHT_TOTAL).toBe(2048);
        for (const { id } of getDuelistList()) {
            const pools = [getDeckOf(id), ...DROP_RANKS.map((rank) => getDropsFrom(id, { rank }))];
            for (const pool of pools) {
                expect(pool.reduce((sum, entry) => sum + entry.weight, 0)).toBe(POOL_WEIGHT_TOTAL);
                for (const entry of pool) expect(getCard(entry.card)).toBeDefined();
            }
        }
    });
});

describe("drops and decks", () => {
    it("gives a duelist's drops for one rank, most likely first", () => {
        const drops = getDropsFrom("simon-muran", { rank: "S/A-POW" });
        expect(drops[0]).toEqual({ duelist: "simon-muran", rank: "S/A-POW", card: 9, weight: 90 });
        expect(drops).toHaveLength(47);
        const sorted = drops.map((drop) => drop.weight);
        expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
    });

    it("gives all three ranks without a rank", () => {
        const ranks = new Set(getDropsFrom("simon-muran").map((drop) => drop.rank));
        expect([...ranks].sort()).toEqual([...DROP_RANKS].sort());
    });

    it("sorts by attack, with the cards that have none last", () => {
        const drops = getDropsFrom("seto-3rd", { rank: "S/A-POW", sort: "attack" });
        const attack = (card: number) => {
            const found = getCard(card);
            return found?.cardType === "Monster" ? found.attack : -1;
        };
        const values = drops.map((drop) => attack(drop.card));
        expect(values).toEqual([...values].sort((a, b) => b - a));
    });

    it("gives a duelist's deck pool", () => {
        expect(getDeckOf("duel-master-k")).toHaveLength(32);
        expect(getDeckOf("nobody")).toEqual([]);
        expect(getDropsFrom("nobody")).toEqual([]);
    });

    it("finds who drops a card, and whose deck holds it", () => {
        expect(getDroppedBy(1)).toEqual([{ duelist: "seto-3rd", rank: "S/A-POW", card: 1, weight: 26 }]);
        expect(getDecksWith(1).map(({ duelist, weight }) => [duelist, weight])).toEqual([
            ["seto-3rd", 120],
            ["seto-2nd", 48],
            ["kaiba", 45],
            ["heishin-2nd", 32],
            ["darknite", 32],
            ["nitemare", 32],
        ]);
    });

    it("reproduces the game's shared tables", () => {
        // Heishin 2nd reuses Heishin's drop pools, and Duel Master K reuses Villager 3's; their decks differ.
        for (const rank of DROP_RANKS) {
            expect(weights(getDropsFrom("heishin-2nd", { rank }))).toEqual(weights(getDropsFrom("heishin", { rank })));
            expect(weights(getDropsFrom("duel-master-k", { rank }))).toEqual(
                weights(getDropsFrom("villager-3", { rank })),
            );
        }
        expect(weights(getDeckOf("heishin-2nd"))).not.toEqual(weights(getDeckOf("heishin")));
    });

    it("turns a weight into a percentage", () => {
        expect(toPercent(2048)).toBe(100);
        expect(toPercent(90)).toBeCloseTo(4.3945, 4);
    });
});

describe("getDuelistPortrait", () => {
    it("links the portrait on Yugipedia, with its file page for attribution", () => {
        expect(getDuelistPortrait("simon-muran")).toEqual({
            url: "https://ms.yugipedia.com/d/d4/FMR_Simon.png",
            width: 176,
            height: 156,
            source: { name: "Yugipedia", pageUrl: "https://yugipedia.com/wiki/File:FMR_Simon.png" },
        });
        expect(getDuelistPortrait("nobody")).toBeUndefined();
    });

    it("has a portrait for every duelist", () => {
        for (const { id } of getDuelistList())
            expect(getDuelistPortrait(id)?.url).toMatch(/^https:\/\/ms\.yugipedia\.com\//);
    });
});
