import { describe, expect, it } from "vitest";

import { getCard, getCardList, getCardsByMonsterType, getCardsByType } from "../src";

describe("getCardList", () => {
    it("returns every card", () => {
        expect(getCardList().length).toBeGreaterThan(0);
    });
});

describe("getCard", () => {
    it("finds a card by id", () => {
        const [first] = getCardList();
        expect(getCard(first.id)).toBe(first);
    });

    it("returns undefined for an unknown id", () => {
        expect(getCard(-1)).toBeUndefined();
    });
});

describe("getCardsByType", () => {
    it("returns only cards of the requested type", () => {
        const magics = getCardsByType("Magic");
        expect(magics.length).toBeGreaterThan(0);
        expect(magics.every((card) => card.cardType === "Magic")).toBe(true);
    });
});

describe("getCardsByMonsterType", () => {
    it("returns only monsters of the requested monster type", () => {
        const thunders = getCardsByMonsterType("Thunder");
        expect(thunders.length).toBeGreaterThan(0);
        expect(thunders.every((card) => card.cardType === "Monster" && card.monsterType === "Thunder")).toBe(true);
    });

    it("returns an empty list when no monster has the type", () => {
        expect(getCardsByMonsterType("Dragon")).toEqual(
            getCardList().filter((card) => card.cardType === "Monster" && card.monsterType === "Dragon"),
        );
    });
});
