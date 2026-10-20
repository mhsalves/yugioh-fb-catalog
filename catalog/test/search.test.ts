import { describe, expect, it } from "vitest";

import { getCardList, searchCards, type ICard } from "../src";

const ids = (items: readonly ICard[]) => items.map((card) => card.id);
const allIdsAscending = () => ids(getCardList()).sort((a, b) => a - b);

describe("searchCards", () => {
    it("returns every card sorted by id when the query is empty", () => {
        const result = searchCards();
        expect(result.total).toBe(getCardList().length);
        expect(ids(result.items)).toEqual(allIdsAscending());
        expect(searchCards({})).toEqual(result);
    });

    it("does not expose the internal card array", () => {
        expect(searchCards().items).not.toBe(getCardList());
    });

    describe("text", () => {
        it("matches a name substring, ignoring case and accents", () => {
            expect(ids(searchCards({ text: "thunder" }).items)).toEqual([425]);
            expect(ids(searchCards({ text: "THÚNDER DRAG" }).items)).toEqual([425]);
        });

        it("ignores surrounding whitespace and treats blank text as no filter", () => {
            expect(ids(searchCards({ text: "  mountain " }).items)).toEqual([332]);
            expect(searchCards({ text: "   " }).total).toBe(getCardList().length);
        });

        it("searches descriptions only with includeDescription", () => {
            expect(searchCards({ text: "lightning" }).total).toBe(0);
            expect(ids(searchCards({ text: "lightning", includeDescription: true }).items)).toEqual([425]);
        });
    });

    describe("list filters", () => {
        it("filters by one card type or several", () => {
            expect(ids(searchCards({ cardType: "Trap" }).items)).toEqual([690]);
            expect(ids(searchCards({ cardType: ["Magic", "Equip"] }).items)).toEqual([315, 332]);
        });

        it("treats an empty list as no filter", () => {
            expect(searchCards({ cardType: [] }).total).toBe(getCardList().length);
        });

        it("filters monsters by monster type and by either guardian star", () => {
            expect(ids(searchCards({ monsterType: "Thunder" }).items)).toEqual([425]);
            expect(ids(searchCards({ guardianStar: "Jupiter" }).items)).toEqual([425]);
            expect(ids(searchCards({ guardianStar: ["Sun", "Pluto"] }).items)).toEqual([425]);
            expect(searchCards({ guardianStar: "Sun" }).total).toBe(0);
        });

        it("filters by id", () => {
            expect(ids(searchCards({ ids: [690, 1, 315] }).items)).toEqual([315, 690]);
        });
    });

    describe("ranges", () => {
        it("keeps only monsters when a monster stat range is set", () => {
            expect(ids(searchCards({ attack: { min: 0 } }).items)).toEqual([425]);
            expect(ids(searchCards({ level: { min: 5, max: 5 } }).items)).toEqual([425]);
            expect(searchCards({ defense: { max: 1499 } }).total).toBe(0);
        });

        it("treats an empty range as no filter", () => {
            expect(searchCards({ attack: {} }).total).toBe(getCardList().length);
        });

        it("filters every card type by cost, with inclusive bounds", () => {
            expect(ids(searchCards({ cost: { min: 100, max: 800 } }).items)).toEqual([315, 425, 674]);
            expect(ids(searchCards({ cost: { min: 999999 } }).items)).toEqual([690]);
        });

        it("combines filters with AND", () => {
            expect(searchCards({ cardType: "Magic", cost: { min: 100 } }).total).toBe(0);
        });
    });

    describe("sort", () => {
        it("sorts by name and cost in both directions", () => {
            const byName = searchCards({ sort: { by: "name" } }).items.map((card) => card.name);
            expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));
            expect(ids(searchCards({ sort: { by: "cost", dir: "desc" } }).items)).toEqual([690, 315, 425, 674, 332]);
        });

        it("puts cards without the sort value last, whatever the direction", () => {
            for (const dir of ["asc", "desc"] as const) {
                const result = ids(searchCards({ sort: { by: "attack", dir } }).items);
                expect(result[0]).toBe(425);
                expect(result.slice(1)).toEqual([315, 332, 674, 690]);
            }
        });
    });

    describe("pagination", () => {
        it("applies offset and limit after sorting, and reports the full total", () => {
            const page = searchCards({ offset: 1, limit: 2 });
            expect(page.total).toBe(getCardList().length);
            expect(ids(page.items)).toEqual(allIdsAscending().slice(1, 3));
        });
    });
});
