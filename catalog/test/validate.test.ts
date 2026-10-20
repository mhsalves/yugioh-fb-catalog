import { describe, expect, it } from "vitest";

import { type DataFile, type Issue, validateData } from "../scripts/lib/data";

/**
 * One failing fixture per validation rule (spec 03 A-2): each test starts from a small valid
 * data set, breaks one thing, and checks that the validator reports it.
 */

const monster = (id: number, overrides: Record<string, unknown> = {}) => ({
    id,
    name: `Monster ${id}`,
    description: "",
    cardType: "Monster",
    password: { code: "12345678", cost: 10 },
    monsterType: "Thunder",
    level: 4,
    attack: 1000,
    defense: 1000,
    guardianStars: ["Mars", "Sun"],
    ...overrides,
});
const card = (id: number, cardType: string, overrides: Record<string, unknown> = {}) => ({
    id,
    name: `${cardType} ${id}`,
    description: "",
    cardType,
    password: { code: "12345678", cost: 10 },
    ...overrides,
});

const ADVANTAGE = {
    Mars: "Jupiter",
    Jupiter: "Saturn",
    Saturn: "Uranus",
    Uranus: "Pluto",
    Pluto: "Neptune",
    Neptune: "Mars",
    Mercury: "Sun",
    Sun: "Moon",
    Moon: "Venus",
    Venus: "Mercury",
};

/** A valid data set; `edit` changes it before validation. */
const fixture = (edit: (files: Record<string, Record<string, unknown>>) => void = () => {}) => {
    const files: Record<string, Record<string, unknown>> = {
        "rules.json": {
            $schema: "../schema/rules.schema.json",
            totalCards: 722,
            guardianStarAdvantage: { ...ADVANTAGE },
            guardianStarBonus: 500,
        },
        "cards/monsters/thunder.json": {
            $schema: "../../../schema/monster-list.schema.json",
            cards: [monster(1), monster(2), monster(3)],
        },
        "cards/ritual.json": { $schema: "../../schema/ritual-list.schema.json", cards: [card(10, "Ritual")] },
        "cards/equip.json": { $schema: "../../schema/equip-list.schema.json", cards: [card(20, "Equip")] },
        "cards/magic.json": { $schema: "../../schema/magic-list.schema.json", cards: [card(30, "Magic")] },
        "rituals.json": {
            $schema: "../schema/rituals.schema.json",
            rituals: [{ ritual: 10, result: 1, materials: [2, 3] }],
        },
        "fusions/thunder.json": {
            $schema: "../../schema/fusions.schema.json",
            fusions: [{ materials: [1, 2], result: 3 }],
        },
        "equips.json": { $schema: "../schema/equips.schema.json", equips: [{ equip: 20, targets: [1], boost: 500 }] },
        "fields.json": {
            $schema: "../schema/fields.schema.json",
            fields: [{ field: 30, boosts: ["Thunder"], weakens: [], amount: 500 }],
        },
    };
    edit(files);
    return Object.entries(files).map(([path, json]): DataFile => ({ path, json }));
};

const list = (files: Record<string, Record<string, unknown>>, file: string, key: string) =>
    files[file][key] as Record<string, unknown>[];

const run = (edit?: Parameters<typeof fixture>[0]) => validateData(fixture(edit));
const messages = (issues: Issue[], level: Issue["level"]) =>
    issues.filter((issue) => issue.level === level).map((issue) => `${issue.file}: ${issue.message}`);

describe("validateData", () => {
    it("accepts the valid fixture with no issues", () => {
        const { issues, catalog } = run();
        expect(issues).toEqual([]);
        expect(catalog?.cards.map((card) => card.id)).toEqual([1, 2, 3, 10, 20, 30]);
    });

    it("reports schema errors with the file and record path", () => {
        const { issues, catalog } = run((files) => {
            list(files, "cards/monsters/thunder.json", "cards")[0].level = 13;
        });
        expect(catalog).toBeUndefined();
        expect(messages(issues, "error")).toEqual([
            expect.stringMatching(/^cards\/monsters\/thunder\.json: cards\[0\]\.level: .*12/),
        ]);
    });

    it("rejects unknown fields (typos)", () => {
        const { issues } = run((files) => {
            list(files, "cards/magic.json", "cards")[0].nmae = "Typo";
        });
        expect(messages(issues, "error")).toEqual([expect.stringContaining("cards/magic.json: cards[0]")]);
    });

    it("rejects a password that is not 8 digits, and a cost out of range", () => {
        const { issues } = run((files) => {
            list(files, "cards/magic.json", "cards")[0].password = { code: "1234567", cost: 1000000 };
        });
        expect(messages(issues, "error")).toEqual([
            expect.stringContaining("cards[0].password.code: must be 8 digits"),
            expect.stringContaining("cards[0].password.cost"),
        ]);
    });

    it("rejects a duplicate id across files", () => {
        const { issues } = run((files) => {
            list(files, "cards/magic.json", "cards")[0].id = 1;
        });
        expect(messages(issues, "error")).toContain(
            "cards/magic.json: id 1 defined in cards/monsters/thunder.json and cards/magic.json",
        );
    });

    it("rejects an id above rules.json totalCards", () => {
        const { issues } = run((files) => {
            files["rules.json"].totalCards = 25;
        });
        expect(messages(issues, "error")).toEqual([
            "cards/magic.json: id 30 is out of range (1..25)",
            "fields.json: field 30 is out of range (1..25)",
        ]);
    });

    it("rejects a monster in another type's file", () => {
        const { issues } = run((files) => {
            list(files, "cards/monsters/thunder.json", "cards")[0].monsterType = "Dragon";
        });
        expect(messages(issues, "error")).toEqual(["cards/monsters/thunder.json: contains a Dragon monster (id 1)"]);
    });

    it("rejects a card in the wrong card-type file", () => {
        const { issues } = run((files) => {
            list(files, "cards/magic.json", "cards")[0].cardType = "Trap";
        });
        expect(messages(issues, "error")).toEqual([expect.stringContaining("cards/magic.json: cards[0].cardType")]);
    });

    it("rejects files outside the layout and monster file names that are not a type", () => {
        const { issues } = run((files) => {
            files["cards/monsters/dragons.json"] = files["cards/monsters/thunder.json"];
            files["notes.json"] = {};
        });
        expect(messages(issues, "error")).toEqual([
            expect.stringContaining('cards/monsters/dragons.json: "dragons" is not a monster type file name'),
            expect.stringContaining("notes.json: unknown data file"),
        ]);
    });

    it("rejects a wrong $schema path", () => {
        const { issues } = run((files) => {
            files["cards/magic.json"].$schema = "../schema/magic-list.schema.json";
        });
        expect(messages(issues, "error")).toEqual([
            'cards/magic.json: $schema: expected "../../schema/magic-list.schema.json", got "../schema/magic-list.schema.json"',
        ]);
    });

    it("requires rules.json", () => {
        const { issues } = validateData(fixture((files) => delete files["rules.json"]));
        expect(messages(issues, "error")).toEqual([expect.stringContaining("rules.json: missing")]);
    });

    it("warns, without failing, when a relation points at a card not entered yet (TBD-A3)", () => {
        const { issues, catalog } = run((files) => {
            list(files, "rituals.json", "rituals")[0].materials = [2, 400];
        });
        expect(catalog).toBeDefined();
        expect(messages(issues, "error")).toEqual([]);
        expect(messages(issues, "warning")).toEqual([
            "rituals.json: ritual 10 → material 400 not found (card not entered yet)",
        ]);
    });

    it("rejects a relation that points at the wrong kind of card", () => {
        const { issues } = run((files) => {
            list(files, "equips.json", "equips")[0].targets = [30];
            list(files, "fields.json", "fields")[0].field = 20;
        });
        expect(messages(issues, "error")).toEqual([
            "equips.json: equip 20 → target 30 is a Magic card, expected Monster",
            "fields.json: field 20 is a Equip card, expected Magic",
        ]);
    });

    it("rejects a relation id out of range", () => {
        const { issues } = run((files) => {
            list(files, "rituals.json", "rituals")[0].result = 900;
        });
        expect(messages(issues, "error")).toEqual(["rituals.json: ritual 10 → result 900 is out of range (1..722)"]);
    });

    it("rejects duplicate recipes, equips and fields", () => {
        const { issues } = run((files) => {
            const rituals = list(files, "rituals.json", "rituals");
            rituals.push({ ...rituals[0] });
            const equips = list(files, "equips.json", "equips");
            equips.push({ ...equips[0] });
            const fields = list(files, "fields.json", "fields");
            fields.push({ ...fields[0] });
        });
        expect(messages(issues, "error")).toEqual([
            "rituals.json: ritual 10 has more than one recipe",
            "equips.json: equip 20 is listed more than once",
            "fields.json: field 30 is listed more than once",
        ]);
    });

    it("warns when a ritual card has no recipe", () => {
        const { issues } = run((files) => {
            files["rituals.json"].rituals = [];
        });
        expect(messages(issues, "warning")).toEqual([
            "cards/ritual.json: ritual card 10 has no recipe in rituals.json",
        ]);
    });

    it("rejects unsorted and duplicated fusion pairs (order-insensitive)", () => {
        const { issues } = run((files) => {
            list(files, "fusions/thunder.json", "fusions").push({ materials: [2, 1], result: 3 });
        });
        expect(messages(issues, "error")).toEqual([
            "fusions/thunder.json: fusion 2 + 1: materials must be sorted (write 1 + 2)",
            "fusions/thunder.json: fusion 2 + 1 is defined more than once (also in fusions/thunder.json)",
        ]);
    });

    it("rejects a fusion in the file of another result type", () => {
        const { issues } = run((files) => {
            files["fusions/dragon.json"] = files["fusions/thunder.json"];
            delete files["fusions/thunder.json"];
            files["fusions/dragon.json"].$schema = "../../schema/fusions.schema.json";
        });
        expect(messages(issues, "error")).toEqual([
            "fusions/dragon.json: fusion 1 + 2 → result 3 is a Thunder monster, expected Dragon in this file",
        ]);
    });

    it("warns about duplicate names", () => {
        const { issues } = run((files) => {
            list(files, "cards/monsters/thunder.json", "cards")[1].name = "Monster 1";
        });
        expect(messages(issues, "warning")).toEqual([
            'cards/monsters/thunder.json: name "Monster 1" is used by cards 1 and 2',
        ]);
    });

    it("reports invalid JSON", () => {
        const { issues } = run((files) => {
            files["equips.json"] = { __parseError: "Unexpected token" };
        });
        expect(messages(issues, "error")).toEqual(["equips.json: invalid JSON: Unexpected token"]);
    });
});
