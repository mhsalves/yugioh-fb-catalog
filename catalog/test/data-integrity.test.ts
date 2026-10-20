import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { FILE_SCHEMAS, type SchemaName, renderJsonSchema } from "../schema/schemas";
import { SCHEMA_DIR, readDataDir, validateData } from "../scripts/lib/data";
import { GUARDIAN_STARS, GUARDIAN_STAR_ADVANTAGE, MONSTER_TYPES, getCardList } from "../src";

/**
 * The real data in catalog/data: it must pass every rule in scripts/lib/data.ts (spec 03 A-2),
 * and the library must expose exactly what the files contain.
 */
const { issues, catalog } = validateData(readDataDir());

describe("catalog data", () => {
    it("has no validation errors", () => {
        expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
    });

    it("is what the library exposes, sorted by id", () => {
        expect(getCardList()).toEqual(catalog?.cards);
        const ids = getCardList().map((card) => card.id);
        expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });

    it.each(Object.keys(FILE_SCHEMAS) as SchemaName[])("schema/%s.schema.json is up to date", (name) => {
        const file = path.join(SCHEMA_DIR, `${name}.schema.json`);
        expect(fs.readFileSync(file, "utf8"), "run `yarn schema:build` in catalog/").toBe(renderJsonSchema(name));
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
