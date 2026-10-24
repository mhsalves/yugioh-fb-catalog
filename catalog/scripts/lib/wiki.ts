import type { CardId, ICard, TMonsterType } from "../../src/data/card-types";
import { GUARDIAN_STARS, MONSTER_TYPES } from "../../src/data/enums";
import type { IRitual } from "../../src/data/relation-types";
import { expectedSchemaRef, fileKind, monsterTypeSlug } from "./data";

/**
 * Converts Yu-Gi-Oh! Wiki (yugioh.fandom.com) data into catalog records (spec 03 A-5). Pure
 * functions only: scripts/sync-wiki.ts does the fetching and writing, the tests use fixtures.
 * Card fields come from the wiki's Semantic MediaWiki properties on the "<name> (FMR)" pages;
 * ritual recipes come from the result monster's {{FMR card}} template (ritual_card, ritual_material),
 * which names cards, so names are matched to ids over every wiki card.
 */

/** The SMW properties the sync asks for, in the order of the ask query. */
export const WIKI_PROPERTIES = [
    "FMR number",
    "English name",
    "Card type",
    "Property",
    "Type",
    "Level",
    "ATK",
    "DEF",
    "Passcode",
    "Star Chip cost",
    "Guardian Star",
    "Lore",
] as const;

interface WikiPage {
    fulltext: string;
}

/** One result of the SMW ask API: page values are { fulltext }, the others are strings or numbers. */
export interface WikiResult {
    fulltext: string;
    printouts: Partial<Record<(typeof WIKI_PROPERTIES)[number], (string | number | WikiPage)[]>>;
}

export type Converted = { card: ICard } | { skip: string };

/** The id and name of a wiki card, also for the cards that cannot be entered (rituals refer to them). */
export const wikiName = ({ printouts: p }: WikiResult) => ({
    id: Number(text(p["FMR number"]?.[0])),
    name: text(p["English name"]?.[0]) ?? "",
});

/** A property value as text (page values give their title). */
export const text = (value: string | number | WikiPage | undefined) =>
    value === undefined ? undefined : typeof value === "object" ? value.fulltext : String(value);

/** Wiki markup to plain text: links keep their label, bold/italics and tags are dropped. */
export const cleanWikiText = (raw: string) =>
    raw
        .replace(/\|$/, "") // SMW keeps the template's trailing separator on Lore
        .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
        .replace(/'{2,}/g, "")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

/** A guardian star in the catalog's spelling; the wiki sometimes writes them in lower case. */
const guardianStar = (value: string | undefined) =>
    GUARDIAN_STARS.find((star) => star.toLowerCase() === value?.trim().toLowerCase());

/** Converts one wiki card to a catalog card, or says why it cannot be entered (spec 02: no guessing). */
export const convertCard = ({ fulltext, printouts: p }: WikiResult): Converted => {
    const first = (key: (typeof WIKI_PROPERTIES)[number]) => text(p[key]?.[0]);
    const id = Number(first("FMR number"));
    const name = first("English name");
    const rawLore = first("Lore") ?? "";
    if (!Number.isInteger(id) || id < 1) return { skip: `${fulltext}: no FMR number` };
    if (!name) return { skip: `${fulltext}: no English name` };

    const code = first("Passcode");
    const cost = first("Star Chip cost");
    if (!code || cost === undefined) return { skip: `${id} ${name}: no passcode or star chip cost on the wiki` };
    if (!/^\d{8}$/.test(code)) return { skip: `${id} ${name}: passcode "${code}" is not 8 digits` };
    const base = { id, name, description: cleanWikiText(rawLore) };
    const password = { code, cost: Number(cost) };

    const cardType = first("Card type");
    switch (cardType) {
        case "Monster Card": {
            const monsterType = first("Type") as TMonsterType;
            const rawStars = (p["Guardian Star"] ?? []).map(text);
            const stars = rawStars.map(guardianStar);
            if (!MONSTER_TYPES.includes(monsterType)) return { skip: `${id} ${name}: unknown type "${monsterType}"` };
            if (stars.length !== 2 || !stars[0] || !stars[1]) {
                return { skip: `${id} ${name}: guardian stars "${rawStars.join(", ")}" are not two known stars` };
            }
            return {
                card: {
                    ...base,
                    cardType: "Monster",
                    password,
                    monsterType,
                    level: Number(first("Level")),
                    attack: Number(first("ATK")),
                    defense: Number(first("DEF")),
                    guardianStars: [stars[0], stars[1]],
                },
            };
        }
        case "Spell Card":
            return {
                card: { ...base, cardType: first("Property") === "Equip Spell Card" ? "Equip" : "Magic", password },
            };
        case "Trap Card":
            return { card: { ...base, cardType: "Trap", password } };
        case "Ritual Card":
            return { card: { ...base, cardType: "Ritual", password } };
        default:
            return { skip: `${id} ${name}: unknown card type "${cardType}"` };
    }
};

/** Named parameters of the first {{FMR card}} template in a page's wikitext (multi-line values kept). */
export const templateParams = (wikitext: string) => {
    const start = wikitext.indexOf("{{FMR card");
    const end = wikitext.indexOf("\n}}", start);
    if (start < 0 || end < 0) return {};
    const params: Record<string, string> = {};
    let key: string | undefined;
    for (const line of wikitext.slice(start, end).split("\n").slice(1)) {
        const param = /^\|\s*([\w ]+?)\s*=\s*(.*)$/.exec(line);
        if (param) params[(key = param[1])] = param[2];
        else if (key) params[key] += `\n${line}`;
    }
    return params;
};

/** The ritual card and material names written on a ritual result monster's page. */
export const ritualFromWikitext = (wikitext: string) => {
    const params = templateParams(wikitext);
    const materials = (params.ritual_material ?? "")
        .split("\n")
        .map((line) => cleanWikiText(line.replace(/^\s*\*/, "")))
        .filter(Boolean);
    return { ritualCard: params.ritual_card && cleanWikiText(params.ritual_card), materials };
};

/** Case-insensitive name → id lookup; names used by more than one card are left out (ambiguous). */
export const nameIndex = (cards: { id: CardId; name: string }[]) => {
    const ids = new Map<string, CardId | null>();
    for (const card of cards) {
        const key = card.name.toLowerCase();
        ids.set(key, ids.has(key) ? null : card.id);
    }
    return (name: string) => ids.get(name.toLowerCase()) ?? undefined;
};

/**
 * The recipe on a monster's page: undefined when the monster is not a ritual result, a message when
 * the recipe names a card that does not match exactly one card.
 */
export const buildRitual = (
    result: { id: CardId; name: string },
    wikitext: string,
    idOf: (name: string) => CardId | undefined,
): IRitual | string | undefined => {
    const recipe = ritualFromWikitext(wikitext);
    if (!recipe.ritualCard) return undefined;
    const label = `ritual for ${result.id} ${result.name}`;
    const ritual = idOf(recipe.ritualCard);
    if (ritual === undefined) return `${label}: ritual card "${recipe.ritualCard}" does not match exactly one card`;
    if (!recipe.materials.length) return `${label}: no ritual_material on its page`;
    const materials: CardId[] = [];
    for (const name of recipe.materials) {
        const id = idOf(name);
        if (id === undefined) return `${label}: material "${name}" does not match exactly one card`;
        materials.push(id);
    }
    return { ritual, result: result.id, materials };
};

/** catalog/data path of the file a card belongs in. */
export const cardFile = (card: ICard) =>
    card.cardType === "Monster"
        ? `cards/monsters/${monsterTypeSlug(card.monsterType)}.json`
        : `cards/${card.cardType.toLowerCase()}.json`;

export interface MergeReport<T> {
    added: T[];
    /** Records that differ from the wiki: kept as they are unless `overwrite` is set. */
    changed: { current: T; wiki: T }[];
    unchanged: number;
}

/** Merges wiki records into the current ones by key. Current records win unless `overwrite` is set. */
export const merge = <T>(current: T[], wiki: T[], key: (record: T) => number, overwrite: boolean) => {
    const byKey = new Map(current.map((record) => [key(record), record]));
    const report: MergeReport<T> = { added: [], changed: [], unchanged: 0 };
    for (const record of wiki) {
        const existing = byKey.get(key(record));
        if (!existing) report.added.push(record);
        else if (JSON.stringify(existing) === JSON.stringify(record)) report.unchanged++;
        else report.changed.push({ current: existing, wiki: record });
        if (!existing || overwrite) byKey.set(key(record), record);
    }
    const records = Array.from(byKey.values()).sort((a, b) => key(a) - key(b));
    return { records, report };
};

/** Groups cards into data files (path → file JSON), with the "$schema" each file needs. */
export const cardFiles = (cards: ICard[]) => {
    const files = new Map<string, { $schema: string; cards: ICard[] }>();
    for (const card of cards) {
        const file = cardFile(card);
        const kind = fileKind(file);
        if (typeof kind === "string") throw new Error(`${file}: ${kind}`);
        if (!files.has(file)) files.set(file, { $schema: expectedSchemaRef(file, kind.schema), cards: [] });
        files.get(file)!.cards.push(card);
    }
    return files;
};
