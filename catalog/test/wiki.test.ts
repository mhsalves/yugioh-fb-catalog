import { describe, expect, it } from "vitest";

import {
    type WikiResult,
    buildRitual,
    cardFiles,
    cleanWikiText,
    convertCard,
    imageFile,
    merge,
    mergeImages,
    nameIndex,
    ritualFromWikitext,
    yugipediaFiles,
    yugipediaImage,
} from "../scripts/lib/wiki";

/** Wiki fixtures follow the shape of real SMW ask results and {{FMR card}} pages (spec 03 A-5). */

const page = (fulltext: string) => ({ fulltext });

const wikiMonster = (overrides: WikiResult["printouts"] = {}): WikiResult => ({
    fulltext: "Thunder Dragon (FMR)",
    printouts: {
        "FMR number": ["425"],
        "English name": ["Thunder Dragon"],
        "Card type": [page("Monster Card")],
        Type: [page("Thunder")],
        Level: [5],
        ATK: [1600],
        DEF: [1500],
        Passcode: ["31786629"],
        "Star Chip cost": [230],
        "Guardian Star": ["Pluto", "Jupiter"],
        Lore: ["A [[dragon]] that summons ''thunder'' and [[Lightning (FMR)|lightning]] to attack its opponents.|"],
        ...overrides,
    },
});

const wikiSpell = (property: string): WikiResult => ({
    fulltext: "Legendary Sword (FMR)",
    printouts: {
        "FMR number": ["301"],
        "English name": ["Legendary Sword"],
        "Card type": [page("Spell Card")],
        Property: [property],
        Passcode: ["61854111"],
        "Star Chip cost": [800],
        Lore: ["A sword that brings out the best in [[warrior]]s.|"],
    },
});

const RESULT_PAGE = `{{FMR card
| type              = Warrior
| guardian_stars    = Moon / Uranus
| lore              = A powerful warrior.
| ritual_card       = Black Luster Ritual
| ritual_material   =
* Beaver Warrior
* [[Gaia The Fierce Knight (FMR)|Gaia the Fierce Knight]]
* Kuriboh
| number            = 364
}}`;

describe("cleanWikiText", () => {
    it("keeps link labels and drops markup and the trailing separator", () => {
        expect(cleanWikiText("A [[dragon]] with ''[[Thunder (FMR)|thunder]]''<br />power &amp; more.|")).toBe(
            "A dragon with thunder power & more.",
        );
    });
});

describe("convertCard", () => {
    it("converts a monster with the catalog's field order", () => {
        const converted = convertCard(wikiMonster());
        expect(converted).toEqual({
            card: {
                id: 425,
                name: "Thunder Dragon",
                description: "A dragon that summons thunder and lightning to attack its opponents.",
                cardType: "Monster",
                password: { code: "31786629", cost: 230 },
                monsterType: "Thunder",
                level: 5,
                attack: 1600,
                defense: 1500,
                guardianStars: ["Pluto", "Jupiter"],
            },
        });
        expect("card" in converted && Object.keys(converted.card)).toEqual([
            "id",
            "name",
            "description",
            "cardType",
            "password",
            "monsterType",
            "level",
            "attack",
            "defense",
            "guardianStars",
        ]);
    });

    it("fixes the case of guardian stars", () => {
        const converted = convertCard(wikiMonster({ "Guardian Star": ["Mars", "moon"] }));
        expect("card" in converted && converted.card.cardType === "Monster" && converted.card.guardianStars).toEqual([
            "Mars",
            "Moon",
        ]);
    });

    it("tells Equip from Magic by the spell's property", () => {
        expect(convertCard(wikiSpell("Equip Spell Card"))).toMatchObject({ card: { cardType: "Equip" } });
        expect(convertCard(wikiSpell("Field Spell Card"))).toMatchObject({ card: { cardType: "Magic" } });
    });

    it("leaves the password out when the wiki has neither a passcode nor a cost", () => {
        const converted = convertCard(wikiMonster({ Passcode: [], "Star Chip cost": [] }));
        expect(converted).toMatchObject({ card: { id: 425, cardType: "Monster", attack: 1600 } });
        expect("card" in converted && "password" in converted.card).toBe(false);
    });

    it("skips cards it cannot enter without guessing", () => {
        expect(convertCard(wikiMonster({ Passcode: [] }))).toEqual({
            skip: "425 Thunder Dragon: the wiki has a passcode or a cost, not both",
        });
        expect(convertCard(wikiMonster({ "Star Chip cost": [] }))).toHaveProperty("skip");
        expect(convertCard(wikiMonster({ Passcode: ["1234"] }))).toHaveProperty("skip");
        expect(convertCard(wikiMonster({ Type: [page("Divine-Beast")] }))).toHaveProperty("skip");
        expect(convertCard(wikiMonster({ "Guardian Star": ["Sun"] }))).toHaveProperty("skip");
    });
});

describe("rituals", () => {
    const idOf = nameIndex([
        { id: 670, name: "Black Luster Ritual" },
        { id: 364, name: "Black Luster Soldier" },
        { id: 61, name: "Beaver Warrior" },
        { id: 6, name: "Gaia The Fierce Knight" },
        { id: 116, name: "Kuriboh" },
        { id: 500, name: "Twin" },
        { id: 501, name: "twin" },
    ]);

    it("reads the ritual card and a multi-line material list", () => {
        expect(ritualFromWikitext(RESULT_PAGE)).toEqual({
            ritualCard: "Black Luster Ritual",
            materials: ["Beaver Warrior", "Gaia the Fierce Knight", "Kuriboh"],
        });
    });

    it("builds the recipe with names matched to ids, ignoring case", () => {
        expect(buildRitual({ id: 364, name: "Black Luster Soldier" }, RESULT_PAGE, idOf)).toEqual({
            ritual: 670,
            result: 364,
            materials: [61, 6, 116],
        });
    });

    it("ignores monsters that are not a ritual result", () => {
        expect(buildRitual({ id: 425, name: "Thunder Dragon" }, "{{FMR card\n| type = Thunder\n}}", idOf)).toBe(
            undefined,
        );
    });

    it("reports names that match no card or more than one", () => {
        const twin = RESULT_PAGE.replace("* Kuriboh", "* Twin");
        expect(buildRitual({ id: 364, name: "Black Luster Soldier" }, twin, idOf)).toMatch(/"Twin" does not match/);
        const unknown = RESULT_PAGE.replace("Black Luster Ritual", "Unknown Ritual");
        expect(buildRitual({ id: 364, name: "Black Luster Soldier" }, unknown, idOf)).toMatch(/"Unknown Ritual"/);
    });
});

describe("merge", () => {
    const key = (record: { id: number }) => record.id;
    const current = [
        { id: 2, v: "mine" },
        { id: 3, v: "same" },
    ];
    const wiki = [
        { id: 1, v: "new" },
        { id: 2, v: "wiki" },
        { id: 3, v: "same" },
    ];

    it("adds new records and keeps the current ones, listing the differences", () => {
        const { records, report } = merge(current, wiki, key, false);
        expect(records).toEqual([
            { id: 1, v: "new" },
            { id: 2, v: "mine" },
            { id: 3, v: "same" },
        ]);
        expect(report).toEqual({
            added: [{ id: 1, v: "new" }],
            changed: [{ current: { id: 2, v: "mine" }, wiki: { id: 2, v: "wiki" } }],
            unchanged: 1,
        });
    });

    it("replaces the current records with overwrite", () => {
        expect(merge(current, wiki, key, true).records).toEqual(wiki);
    });
});

describe("cardFiles", () => {
    it("puts each card in its file with that file's $schema", () => {
        const cards = [convertCard(wikiMonster()), convertCard(wikiSpell("Equip Spell Card"))].map((converted) =>
            "card" in converted ? converted.card : expect.fail(converted.skip),
        );
        const files = cardFiles(cards);
        expect(Array.from(files.keys())).toEqual(["cards/monsters/thunder.json", "cards/equip.json"]);
        expect(files.get("cards/monsters/thunder.json")!.$schema).toBe("../../../schema/monster-list.schema.json");
        expect(files.get("cards/equip.json")!.$schema).toBe("../../schema/equip-list.schema.json");
    });
});

describe("images", () => {
    const fandom = (file: string, cb: string) =>
        `https://static.wikia.nocookie.net/yugioh/images/e/e1/${file}/revision/latest?cb=${cb}`;

    it("takes the card's image file, but not Fandom's card-back placeholder", () => {
        expect(imageFile(wikiMonster({ "Card image": ["ThunderDragon-FMR-EN-VG.png"] }))).toBe(
            "ThunderDragon-FMR-EN-VG.png",
        );
        expect(imageFile(wikiMonster({ "Card image": ["Back-FMR-EN-VG.png"] }))).toBeUndefined();
        expect(imageFile(wikiMonster())).toBeUndefined();
    });

    it("names Yugipedia's files from the card name", () => {
        expect(yugipediaFiles("Patrol Robo")).toEqual(["PatrolRobo-FMR-NA-VG.png"]);
        expect(yugipediaFiles("Wodan the Resident of the Forest")).toEqual([
            "WodanTheResidentOfTheForest-FMR-NA-VG.png",
            "WodantheResidentoftheForest-FMR-NA-VG.png",
        ]);
        expect(yugipediaFiles("Master & Expert")).toEqual(["MasterExpert-FMR-NA-VG.png"]);
    });

    it("crops Yugipedia's 320 × 240 card screens to the card, and refuses other sizes", () => {
        const url = "https://ms.yugipedia.com/e/ee/PatrolRobo-FMR-NA-VG.png";
        expect(yugipediaImage(580, { url, width: 320, height: 240 })).toEqual({
            card: 580,
            source: "yugipedia",
            url,
            width: 320,
            height: 240,
            crop: { x: 4, y: 6, width: 136, height: 192 },
        });
        expect(yugipediaImage(580, { url, width: 300, height: 423 })).toMatch(/not a 320 × 240 card screen/);
    });

    it("takes a new revision of the same file, but keeps a different file pasted by hand", () => {
        const current = [
            { card: 1, source: "fandom", url: fandom("A.png", "1") },
            { card: 2, source: "fandom", url: fandom("Mine.png", "1") },
        ];
        const wiki = [
            { card: 1, source: "fandom", url: fandom("A.png", "2"), width: 300, height: 423 },
            { card: 2, source: "fandom", url: fandom("B.png", "2") },
            { card: 3, source: "fandom", url: fandom("C.png", "2") },
        ];
        const { records, report, refreshed } = mergeImages(current, wiki, false);
        expect(records).toEqual([wiki[0], current[1], wiki[2]]);
        expect(report.added).toEqual([wiki[2]]);
        expect(refreshed).toBe(1);
        expect(mergeImages(current, wiki, true).records).toEqual(wiki);
    });
});
