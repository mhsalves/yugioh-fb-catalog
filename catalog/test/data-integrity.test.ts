import { describe, expect, it } from "vitest";

import { GUARDIAN_STARS, GUARDIAN_STAR_ADVANTAGE, MONSTER_TYPES, TOTAL_CARDS, getCard, getCardList } from "../src";
import equips from "../src/data/equips";
import fields from "../src/data/fields";
import fusions from "../src/data/fusions";
import rituals from "../src/data/rituals";

/**
 * Data integrity checks (spec 03 §4, A-2) that TypeScript cannot express.
 */
const cards = getCardList();

const expectCardId = (id: number) => {
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThanOrEqual(1);
    expect(id).toBeLessThanOrEqual(TOTAL_CARDS);
};

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
        expectCardId(card.id);
        expect(card.name.trim()).not.toBe("");
        expect(card.password.code).toMatch(/^\d{8}$/);
        expect(Number.isInteger(card.password.cost)).toBe(true);
        expect(card.password.cost).toBeGreaterThanOrEqual(0);
        expect(card.password.cost).toBeLessThanOrEqual(999999);
    });

    it.each(cards.filter((card) => card.cardType === "Monster").map((card) => [card.id, card] as const))(
        "monster %i has a valid type, level, points and guardian stars",
        (_, card) => {
            expect(MONSTER_TYPES).toContain(card.monsterType);
            expect(Number.isInteger(card.level)).toBe(true);
            expect(card.level).toBeGreaterThanOrEqual(1);
            expect(card.level).toBeLessThanOrEqual(12);
            for (const points of [card.attack, card.defense]) {
                expect(Number.isInteger(points)).toBe(true);
                expect(points).toBeGreaterThanOrEqual(0);
            }
            expect(card.guardianStars).toHaveLength(2);
            for (const star of card.guardianStars) expect(GUARDIAN_STARS).toContain(star);
        },
    );
});

describe("relation integrity", () => {
    it("every ritual card has exactly one recipe, and every recipe belongs to a ritual card", () => {
        const recipeIds = rituals.map((ritual) => ritual.ritual);
        expect(new Set(recipeIds).size).toBe(recipeIds.length);
        for (const id of recipeIds) expect(getCard(id)?.cardType).toBe("Ritual");
        for (const card of cards.filter((card) => card.cardType === "Ritual")) expect(recipeIds).toContain(card.id);
    });

    it("ritual recipes reference card ids in range", () => {
        for (const ritual of rituals) {
            for (const id of [ritual.result, ...ritual.materials]) expectCardId(id);
            expect(ritual.materials.length).toBeGreaterThan(0);
        }
    });

    it("fusions are stored once per pair, with sorted materials in range", () => {
        const pairs = fusions.map(({ materials: [a, b] }) => {
            expectCardId(a);
            expectCardId(b);
            expect(a).toBeLessThanOrEqual(b);
            return `${a}+${b}`;
        });
        expect(new Set(pairs).size).toBe(pairs.length);
        for (const fusion of fusions) expectCardId(fusion.result);
    });

    it("equip and field entries reference card ids in range, once each", () => {
        for (const ids of [equips.map((equip) => equip.equip), fields.map((field) => field.field)]) {
            expect(new Set(ids).size).toBe(ids.length);
            ids.forEach(expectCardId);
        }
        for (const equip of equips) equip.targets.forEach(expectCardId);
    });
});

describe("game rules", () => {
    it("has the full lists, with no duplicates", () => {
        expect(MONSTER_TYPES).toHaveLength(20);
        expect(new Set(MONSTER_TYPES).size).toBe(20);
        expect(GUARDIAN_STARS).toHaveLength(10);
        expect(new Set(GUARDIAN_STARS).size).toBe(10);
    });

    it("guardian star advantage forms the game's two cycles", () => {
        const cycleFrom = (start: (typeof GUARDIAN_STARS)[number]) => {
            const cycle = [start];
            for (let star = GUARDIAN_STAR_ADVANTAGE[start]; star !== start; star = GUARDIAN_STAR_ADVANTAGE[star]) {
                cycle.push(star);
            }
            return cycle;
        };
        expect(cycleFrom("Mars")).toEqual(["Mars", "Jupiter", "Saturn", "Uranus", "Pluto", "Neptune"]);
        expect(cycleFrom("Sun")).toEqual(["Sun", "Moon", "Venus", "Mercury"]);
    });
});
