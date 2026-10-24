import { describe, expect, it } from "vitest";

import { getCardList, searchCards, type CardQuery, type ICard } from "../src";

/**
 * The expectations are written against whatever is in catalog/data, so they keep holding while
 * cards are added: each filter must return exactly the cards its predicate picks, in id order.
 * Thunder Dragon (425), Mountain (332) and Fake Trap (690) anchor the tests that need a known card.
 */

const ids = (items: readonly ICard[]) => items.map((card) => card.id);
const allIdsAscending = () => ids(getCardList()).sort((a, b) => a - b);
const where = (predicate: (card: ICard) => boolean) => allIdsAscending().filter((id) => predicate(card(id)));
const card = (id: number) => getCardList().find((item) => item.id === id)!;
const isMonster = (item: ICard) => item.cardType === "Monster";

/** Asserts that the query returns exactly the cards the predicate picks, and at least one. */
const expectMatches = (query: CardQuery, predicate: (card: ICard) => boolean) => {
    const expected = where(predicate);
    expect(expected.length).toBeGreaterThan(0);
    expect(ids(searchCards(query).items)).toEqual(expected);
};

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
            expectMatches({ text: "thunder" }, (item) => item.name.toLowerCase().includes("thunder"));
            expect(ids(searchCards({ text: "thunder" }).items)).toContain(425);
            expect(ids(searchCards({ text: "THÚNDER DRAG" }).items)).toContain(425);
        });

        it("ignores surrounding whitespace and treats blank text as no filter", () => {
            expect(searchCards({ text: "  mountain " })).toEqual(searchCards({ text: "mountain" }));
            expect(ids(searchCards({ text: "  mountain " }).items)).toContain(332);
            expect(searchCards({ text: "   " }).total).toBe(getCardList().length);
        });

        it("searches descriptions only with includeDescription", () => {
            const inName = (item: ICard) => item.name.toLowerCase().includes("lightning");
            expect(ids(searchCards({ text: "lightning" }).items)).toEqual(where(inName));
            expectMatches(
                { text: "lightning", includeDescription: true },
                (item) => inName(item) || item.description.toLowerCase().includes("lightning"),
            );
            expect(ids(searchCards({ text: "lightning", includeDescription: true }).items)).toContain(425);
        });
    });

    describe("list filters", () => {
        it("filters by one card type or several", () => {
            expectMatches({ cardType: "Trap" }, (item) => item.cardType === "Trap");
            expectMatches({ cardType: ["Magic", "Equip"] }, (item) => ["Magic", "Equip"].includes(item.cardType));
        });

        it("treats an empty list as no filter", () => {
            expect(searchCards({ cardType: [] }).total).toBe(getCardList().length);
        });

        it("filters monsters by monster type and by either guardian star", () => {
            const stars = (item: ICard): string[] => (item.cardType === "Monster" ? item.guardianStars : []);
            expectMatches({ monsterType: "Thunder" }, (item) => isMonster(item) && item.monsterType === "Thunder");
            expectMatches({ guardianStar: "Jupiter" }, (item) => stars(item).includes("Jupiter"));
            expectMatches(
                { guardianStar: ["Sun", "Pluto"] },
                (item) => stars(item).includes("Sun") || stars(item).includes("Pluto"),
            );
        });

        it("filters by id", () => {
            const known = [690, 425, 332];
            expect(ids(searchCards({ ids: [...known, 9999] }).items)).toEqual([...known].sort((a, b) => a - b));
        });
    });

    describe("ranges", () => {
        it("keeps only monsters when a monster stat range is set", () => {
            expectMatches({ attack: { min: 0 } }, isMonster);
            expectMatches({ level: { min: 5, max: 5 } }, (item) => isMonster(item) && item.level === 5);
            expectMatches({ defense: { max: 1500 } }, (item) => isMonster(item) && item.defense <= 1500);
        });

        it("treats an empty range as no filter", () => {
            expect(searchCards({ attack: {} }).total).toBe(getCardList().length);
        });

        it("filters every card type by cost, with inclusive bounds", () => {
            const cost = card(425).password!.cost;
            expectMatches({ cost: { min: cost, max: cost } }, (item) => item.password?.cost === cost);
            expectMatches({ cost: { min: 999999 } }, (item) => item.password?.cost === 999999);
            expect(ids(searchCards({ cost: { min: 999999 } }).items)).toContain(690);
        });

        it("leaves cards without a password out of a cost range, and keeps them without one", () => {
            const noPassword = where((item) => !item.password);
            expect(ids(searchCards({ cost: { min: 0 } }).items)).toEqual(where((item) => !!item.password));
            expect(searchCards({ cost: {} }).total).toBe(getCardList().length);
            for (const id of noPassword) expect(ids(searchCards({ cost: { max: 999999 } }).items)).not.toContain(id);
        });

        it("combines filters with AND", () => {
            expectMatches(
                { cardType: "Magic", cost: { max: 100 } },
                (item) => item.cardType === "Magic" && item.password !== undefined && item.password.cost <= 100,
            );
        });
    });

    describe("sort", () => {
        it("sorts by name and cost in both directions", () => {
            const byName = searchCards({ sort: { by: "name" } }).items.map((item) => item.name);
            expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)));
            const byCost = searchCards({ sort: { by: "cost", dir: "desc" } }).items;
            const priced = byCost.filter((item) => item.password);
            for (let i = 1; i < priced.length; i++) {
                const [previous, current] = [priced[i - 1].password!.cost, priced[i].password!.cost];
                expect(previous).toBeGreaterThanOrEqual(current);
                if (previous === current) expect(priced[i - 1].id).toBeLessThan(priced[i].id);
            }
            // Cards without a password have no cost, so they come after every priced card.
            expect(ids(byCost.slice(priced.length))).toEqual(where((item) => !item.password));
        });

        it("puts cards without the sort value last, whatever the direction", () => {
            const monsters = where(isMonster).length;
            for (const dir of ["asc", "desc"] as const) {
                const result = searchCards({ sort: { by: "attack", dir } }).items;
                const sign = dir === "desc" ? -1 : 1;
                const attacks = result
                    .slice(0, monsters)
                    .map((item) => (item.cardType === "Monster" ? item.attack : NaN));
                expect(attacks).toEqual([...attacks].sort((a, b) => sign * (a - b)));
                expect(ids(result.slice(monsters))).toEqual(where((item) => !isMonster(item)));
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
