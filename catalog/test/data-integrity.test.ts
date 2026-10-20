import { describe, expect, it } from "vitest";

import { getCardList } from "../src";

/**
 * Data integrity checks (spec 03 §4, A-2) that TypeScript cannot express.
 * The ID upper bound is 722 until TBD-D10 (722 vs 721 cards) is resolved.
 */
const MAX_CARD_ID = 722;

const cards = getCardList();

describe("catalog data integrity", () => {
    it("has unique ids", () => {
        const seen = new Set<number>();
        const duplicates = cards.filter((card) => seen.has(card.id) || !seen.add(card.id)).map((card) => card.id);
        expect(duplicates).toEqual([]);
    });

    it("is sorted by id", () => {
        const ids = cards.map((card) => card.id);
        expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });

    it.each(cards.map((card) => [card.id, card] as const))("card %i has a valid id, name and password", (_, card) => {
        expect(Number.isInteger(card.id)).toBe(true);
        expect(card.id).toBeGreaterThanOrEqual(1);
        expect(card.id).toBeLessThanOrEqual(MAX_CARD_ID);
        expect(card.name.trim()).not.toBe("");
        expect(card.password.code).toMatch(/^\d{8}$/);
        expect(Number.isInteger(card.password.cost)).toBe(true);
        expect(card.password.cost).toBeGreaterThanOrEqual(0);
        expect(card.password.cost).toBeLessThanOrEqual(999999);
    });

    it.each(cards.filter((card) => card.cardType === "Monster").map((card) => [card.id, card] as const))(
        "monster %i has a level between 1 and 12",
        (_, card) => {
            expect(Number.isInteger(card.level)).toBe(true);
            expect(card.level).toBeGreaterThanOrEqual(1);
            expect(card.level).toBeLessThanOrEqual(12);
        },
    );

    it.each(cards.filter((card) => card.cardType === "Ritual").map((card) => [card.id, card] as const))(
        "ritual %i references card ids in range",
        (_, card) => {
            for (const id of [card.summon.monsterResultId, ...card.summon.monsterMaterialIds]) {
                expect(id).toBeGreaterThanOrEqual(1);
                expect(id).toBeLessThanOrEqual(MAX_CARD_ID);
            }
        },
    );
});
