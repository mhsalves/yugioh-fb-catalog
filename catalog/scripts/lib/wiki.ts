import type { CardId, ICard, TMonsterType } from "../../src/data/card-types";
import { GUARDIAN_STARS, MONSTER_TYPES } from "../../src/data/enums";
import type { ICardImageRef, IImageSource, IRitual } from "../../src/data/relation-types";
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
    "Card image",
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

    // The game gives no password to ritual results and story cards: the wiki then has neither value.
    const code = first("Passcode");
    const cost = first("Star Chip cost");
    if (!code !== (cost === undefined)) return { skip: `${id} ${name}: the wiki has a passcode or a cost, not both` };
    if (code && !/^\d{8}$/.test(code)) return { skip: `${id} ${name}: passcode "${code}" is not 8 digits` };
    const base = { id, name, description: cleanWikiText(rawLore) };
    /** Spread after cardType, so the field keeps its place in the JSON and is left out when there is none. */
    const password = code ? { password: { code, cost: Number(cost) } } : {};

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
                    ...password,
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
                card: { ...base, cardType: first("Property") === "Equip Spell Card" ? "Equip" : "Magic", ...password },
            };
        case "Trap Card":
            return { card: { ...base, cardType: "Trap", ...password } };
        case "Ritual Card":
            return { card: { ...base, cardType: "Ritual", ...password } };
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

/** The sources entry of images.json (spec 08 I-2). */
export const IMAGE_SOURCES: Record<string, IImageSource> = {
    fandom: { name: "Yu-Gi-Oh! Wiki (Fandom)", filePageUrl: "https://yugioh.fandom.com/wiki/File:" },
    yugipedia: { name: "Yugipedia", filePageUrl: "https://yugipedia.com/wiki/File:" },
};

/** Fandom shows the card back for the cards it has no picture of; Yugipedia fills those in. */
export const PLACEHOLDER_IMAGE = "Back-FMR-EN-VG.png";

/**
 * Yugipedia's FM images are 320 × 240 screenshots of the game's card screen: the card is this
 * rectangle on the left, the rest is its type, guardian stars and text (measured on the frame).
 */
export const YUGIPEDIA_SCREEN = { width: 320, height: 240 };
export const YUGIPEDIA_CROP = { x: 4, y: 6, width: 136, height: 192 };

/** File names Yugipedia may use for a card, "Patrol Robo" → "PatrolRobo-FMR-NA-VG.png" (NA = the US game). */
export const yugipediaFiles = (name: string) => {
    const words = name
        .replace(/-/g, " ")
        .replace(/[^A-Za-z0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean);
    const camel = words.map((word) => word[0].toUpperCase() + word.slice(1)).join("");
    const plain = name.replace(/[^A-Za-z0-9]/g, "");
    return Array.from(new Set([camel, plain])).map((base) => `${base}-FMR-NA-VG.png`);
};

/** An images.json entry for a Yugipedia screenshot, cropped to the card; a message when it is not one. */
export const yugipediaImage = (card: CardId, info: { url: string; width: number; height: number }) =>
    info.width === YUGIPEDIA_SCREEN.width && info.height === YUGIPEDIA_SCREEN.height
        ? ({ card, source: "yugipedia", url: info.url, ...YUGIPEDIA_SCREEN, crop: YUGIPEDIA_CROP } as ICardImageRef)
        : `image of card ${card}: Yugipedia's ${info.width} × ${info.height} image is not a 320 × 240 card screen`;

/** A file name as MediaWiki stores it: underscores for spaces. */
export const normalizeFileName = (name: string) => name.trim().replace(/ /g, "_");

/** The card's image file on the wiki, or undefined when it only has the placeholder. */
export const imageFile = ({ printouts: p }: WikiResult) => {
    const file = text(p["Card image"]?.[0]);
    return file && normalizeFileName(file) !== PLACEHOLDER_IMAGE ? normalizeFileName(file) : undefined;
};

/** The file name in an image URL: the segment after the md5 folders (…/<h>/<hh>/<file>). */
export const imageUrlFile = (url: string) =>
    decodeURIComponent(/\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/.exec(url)?.[1] ?? "");

/**
 * Merges wiki images into images.json. A wiki entry for the same file as the current one replaces it,
 * so new "?cb=" revisions and sizes come in; a different file pasted by hand is kept unless `overwrite`.
 */
export const mergeImages = (current: ICardImageRef[], wiki: ICardImageRef[], overwrite: boolean) => {
    const merged = merge(current, wiki, (image) => image.card, overwrite);
    const wikiByCard = new Map(wiki.map((image) => [image.card, image]));
    const sameFile = (image: ICardImageRef) => {
        const update = wikiByCard.get(image.card);
        return update !== undefined && imageUrlFile(update.url) === imageUrlFile(image.url);
    };
    const records = merged.records.map((image) => (sameFile(image) ? wikiByCard.get(image.card)! : image));
    const refreshed = merged.report.changed.filter(({ current }) => sameFile(current)).length;
    return { records, report: merged.report, refreshed };
};
