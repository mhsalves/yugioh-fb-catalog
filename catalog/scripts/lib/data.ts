import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { FILE_SCHEMAS, IMAGE_URLS, type SchemaName } from "../../schema/schemas";
import type { CardId, ICard, TMonsterType } from "../../src/data/card-types";
import type { IDuelist, IDuelistPools, IPoolEntry } from "../../src/data/duelist-types";
import { DROP_RANKS, MONSTER_TYPES } from "../../src/data/enums";
import type {
    ICardImageRef,
    IEquipCompat,
    IFieldEffect,
    IFusion,
    IImageSource,
    IRitual,
} from "../../src/data/relation-types";
import type { IGameRules } from "../../src/data/rules";

/**
 * Loads and validates catalog/data (spec 03 A-1, A-2). Used by validate.ts, build-data.ts,
 * coverage.ts and the tests, which run the same rules against small fixtures.
 */

export const CATALOG_DIR = path.resolve(__dirname, "../..");
export const DATA_DIR = path.join(CATALOG_DIR, "data");
export const SCHEMA_DIR = path.join(CATALOG_DIR, "schema");

/** A data file: its path relative to catalog/data (with "/") and its parsed JSON. */
export interface DataFile {
    path: string;
    json: unknown;
}

export interface Issue {
    level: "error" | "warning";
    file: string;
    message: string;
}

export interface Catalog {
    cards: ICard[];
    rituals: IRitual[];
    fusions: IFusion[];
    equips: IEquipCompat[];
    fields: IFieldEffect[];
    images: ICardImageRef[];
    imageSources: Record<string, IImageSource>;
    /** In the game's order (`number`). */
    duelists: IDuelist[];
    /** Each duelist's pools, by duelist id. */
    duelistPools: Record<string, IDuelistPools>;
    rules: IGameRules;
}

/** File name of a monster type: "Winged Beast" → "winged-beast". */
export const monsterTypeSlug = (monsterType: TMonsterType) => monsterType.toLowerCase().replace(/ /g, "-");
const MONSTER_TYPE_BY_SLUG = new Map(MONSTER_TYPES.map((monsterType) => [monsterTypeSlug(monsterType), monsterType]));

interface FileKind {
    schema: SchemaName;
    /** Monster type named by the file (cards/monsters/<type>.json, fusions/<type>.json). */
    monsterType?: TMonsterType;
}

const FIXED_FILES: Record<string, SchemaName> = {
    "cards/magic.json": "magic-list",
    "cards/trap.json": "trap-list",
    "cards/equip.json": "equip-list",
    "cards/ritual.json": "ritual-list",
    "rituals.json": "rituals",
    "equips.json": "equips",
    "fields.json": "fields",
    "rules.json": "rules",
    "images.json": "images",
};

/** The kind of a data file from its path, or an error message when the path is not part of the layout. */
export const fileKind = (file: string): FileKind | string => {
    if (FIXED_FILES[file]) return { schema: FIXED_FILES[file] };
    if (/^duelists\/[^/]+\.json$/.test(file)) return { schema: "duelist" };
    const typed = /^(cards\/monsters|fusions)\/([^/]+)\.json$/.exec(file);
    if (typed) {
        const monsterType = MONSTER_TYPE_BY_SLUG.get(typed[2]);
        if (!monsterType) {
            return `"${typed[2]}" is not a monster type file name (expected one of: ${[...MONSTER_TYPE_BY_SLUG.keys()].join(", ")})`;
        }
        return { schema: typed[1] === "fusions" ? "fusions" : "monster-list", monsterType };
    }
    return `unknown data file (see catalog/CONTRIBUTING-DATA.md for where each kind of data goes)`;
};

/** The "$schema" value a data file must have: the relative path to its JSON Schema. */
export const expectedSchemaRef = (file: string, schema: SchemaName) =>
    path.posix.relative(path.posix.dirname(path.posix.join("data", file)), `schema/${schema}.schema.json`);

/** Reads every .json file under `dir` (default catalog/data), in path order. */
export const readDataDir = (dir = DATA_DIR): DataFile[] => {
    const files: DataFile[] = [];
    const walk = (current: string) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith(".json")) {
                const rel = path.relative(dir, full).split(path.sep).join("/");
                let json: unknown;
                try {
                    json = JSON.parse(fs.readFileSync(full, "utf8"));
                } catch (error) {
                    json = { __parseError: (error as Error).message };
                }
                files.push({ path: rel, json });
            }
        }
    };
    walk(dir);
    return files.sort((a, b) => a.path.localeCompare(b.path));
};

const formatPath = (keys: readonly PropertyKey[]) =>
    keys.reduce<string>(
        (out, key) => (typeof key === "number" ? `${out}[${key}]` : `${out}${out ? "." : ""}${String(key)}`),
        "",
    );

/**
 * Validates the data files and builds the catalog. Errors make the data unusable (build fails);
 * warnings flag incomplete data, such as a relation pointing at a card not entered yet (TBD-A3).
 */
export const validateData = (files: DataFile[]): { issues: Issue[]; catalog?: Catalog } => {
    const issues: Issue[] = [];
    const error = (file: string, message: string) => issues.push({ level: "error", file, message });
    const warning = (file: string, message: string) => issues.push({ level: "warning", file, message });

    const cardFile = new Map<CardId, string>();
    const catalog: Catalog = {
        cards: [],
        rituals: [],
        fusions: [],
        equips: [],
        fields: [],
        images: [],
        imageSources: {},
        duelists: [],
        duelistPools: {},
        rules: undefined!,
    };
    const duelistFile = new Map<IDuelist, string>();
    const fusionFiles: { file: string; fusion: IFusion; monsterType: TMonsterType }[] = [];
    /** File each relation record came from, for error messages. */
    const relationFile = new Map<object, string>();

    for (const { path: file, json } of files) {
        if (json && typeof json === "object" && "__parseError" in json) {
            error(file, `invalid JSON: ${(json as { __parseError: string }).__parseError}`);
            continue;
        }
        const kind = fileKind(file);
        if (typeof kind === "string") {
            error(file, kind);
            continue;
        }
        const result = FILE_SCHEMAS[kind.schema].safeParse(json);
        if (!result.success) {
            for (const issue of result.error.issues)
                error(file, `${formatPath(issue.path) || "(file)"}: ${issue.message}`);
            continue;
        }
        const data = result.data as Record<string, unknown> & { $schema: string };
        const schemaRef = expectedSchemaRef(file, kind.schema);
        if (data.$schema !== schemaRef) error(file, `$schema: expected "${schemaRef}", got "${data.$schema}"`);

        switch (kind.schema) {
            case "rules":
                if (catalog.rules) error(file, "rules are defined more than once");
                catalog.rules = { ...(data as unknown as IGameRules & { $schema?: string }) };
                delete (catalog.rules as { $schema?: string }).$schema;
                break;
            case "rituals":
                for (const ritual of data.rituals as IRitual[]) {
                    catalog.rituals.push(ritual);
                    relationFile.set(ritual, file);
                }
                break;
            case "equips":
                for (const equip of data.equips as IEquipCompat[]) {
                    catalog.equips.push(equip);
                    relationFile.set(equip, file);
                }
                break;
            case "fields":
                for (const field of data.fields as IFieldEffect[]) {
                    catalog.fields.push(field);
                    relationFile.set(field, file);
                }
                break;
            case "images":
                Object.assign(catalog.imageSources, data.sources);
                for (const image of data.images as ICardImageRef[]) {
                    catalog.images.push(image);
                    relationFile.set(image, file);
                }
                break;
            case "duelist": {
                const { id, number, name, portrait, deck, drops } = data as unknown as IDuelist & IDuelistPools;
                const duelist: IDuelist = { id, number, name, portrait };
                if (file !== `duelists/${duelist.id}.json`) {
                    error(file, `id "${duelist.id}" must match the file name (duelists/${duelist.id}.json)`);
                }
                catalog.duelists.push(duelist);
                catalog.duelistPools[duelist.id] = { deck, drops };
                duelistFile.set(duelist, file);
                break;
            }
            case "fusions":
                for (const fusion of data.fusions as IFusion[]) {
                    catalog.fusions.push(fusion);
                    fusionFiles.push({ file, fusion, monsterType: kind.monsterType! });
                }
                break;
            default:
                for (const card of data.cards as ICard[]) {
                    if (kind.monsterType && card.cardType === "Monster" && card.monsterType !== kind.monsterType) {
                        error(file, `contains a ${card.monsterType} monster (id ${card.id})`);
                    }
                    const other = cardFile.get(card.id);
                    if (other) error(file, `id ${card.id} defined in ${other} and ${file}`);
                    else cardFile.set(card.id, file);
                    catalog.cards.push(card);
                }
        }
    }

    if (!catalog.rules) {
        error("rules.json", "missing: rules.json is required (totalCards, guardian star rules)");
        return { issues };
    }
    const { totalCards, poolWeightTotal: totalWeight } = catalog.rules;
    const byId = new Map<CardId, ICard>();
    for (const card of catalog.cards) if (!byId.has(card.id)) byId.set(card.id, card);

    const inRange = (file: string, label: string, id: CardId) => {
        if (id > totalCards) error(file, `${label} ${id} is out of range (1..${totalCards})`);
        return id <= totalCards;
    };
    /** Checks a relation reference: out of range or wrong card type is an error, not entered yet is a warning. */
    const reference = (file: string, label: string, id: CardId, cardType: ICard["cardType"]) => {
        if (!inRange(file, label, id)) return;
        const card = byId.get(id);
        if (!card) warning(file, `${label} ${id} not found (card not entered yet)`);
        else if (card.cardType !== cardType)
            error(file, `${label} ${id} is a ${card.cardType} card, expected ${cardType}`);
    };

    for (const card of catalog.cards) inRange(cardFile.get(card.id)!, "id", card.id);

    const names = new Map<string, CardId>();
    for (const card of catalog.cards) {
        const key = card.name.toLowerCase();
        const other = names.get(key);
        if (other !== undefined)
            warning(cardFile.get(card.id)!, `name "${card.name}" is used by cards ${other} and ${card.id}`);
        else names.set(key, card.id);
    }

    const ritualIds = new Set<CardId>();
    for (const ritual of catalog.rituals) {
        const file = relationFile.get(ritual)!;
        if (ritualIds.has(ritual.ritual)) error(file, `ritual ${ritual.ritual} has more than one recipe`);
        ritualIds.add(ritual.ritual);
        reference(file, `ritual ${ritual.ritual} → ritual card`, ritual.ritual, "Ritual");
        reference(file, `ritual ${ritual.ritual} → result`, ritual.result, "Monster");
        for (const id of ritual.materials) reference(file, `ritual ${ritual.ritual} → material`, id, "Monster");
    }
    for (const card of catalog.cards) {
        if (card.cardType === "Ritual" && !ritualIds.has(card.id)) {
            warning(cardFile.get(card.id)!, `ritual card ${card.id} has no recipe in rituals.json`);
        }
    }

    const pairs = new Map<string, string>();
    for (const { file, fusion, monsterType } of fusionFiles) {
        const [a, b] = fusion.materials;
        const label = `fusion ${a} + ${b}`;
        if (a > b) error(file, `${label}: materials must be sorted (write ${b} + ${a})`);
        const key = `${Math.min(a, b)}+${Math.max(a, b)}`;
        const other = pairs.get(key);
        if (other) error(file, `${label} is defined more than once (also in ${other})`);
        else pairs.set(key, file);
        reference(file, `${label} → material`, a, "Monster");
        reference(file, `${label} → material`, b, "Monster");
        reference(file, `${label} → result`, fusion.result, "Monster");
        const result = byId.get(fusion.result);
        if (result?.cardType === "Monster" && result.monsterType !== monsterType) {
            error(
                file,
                `${label} → result ${fusion.result} is a ${result.monsterType} monster, expected ${monsterType} in this file`,
            );
        }
    }

    const equipIds = new Set<CardId>();
    for (const equip of catalog.equips) {
        const file = relationFile.get(equip)!;
        if (equipIds.has(equip.equip)) error(file, `equip ${equip.equip} is listed more than once`);
        equipIds.add(equip.equip);
        reference(file, "equip", equip.equip, "Equip");
        for (const id of equip.targets) reference(file, `equip ${equip.equip} → target`, id, "Monster");
    }

    const fieldIds = new Set<CardId>();
    for (const field of catalog.fields) {
        const file = relationFile.get(field)!;
        if (fieldIds.has(field.field)) error(file, `field ${field.field} is listed more than once`);
        fieldIds.add(field.field);
        reference(file, "field", field.field, "Magic");
    }

    const imageIds = new Set<CardId>();
    for (const image of catalog.images) {
        const file = relationFile.get(image)!;
        const label = `image of card ${image.card}`;
        if (imageIds.has(image.card)) error(file, `card ${image.card} has more than one image`);
        imageIds.add(image.card);
        if (inRange(file, label, image.card) && !byId.has(image.card))
            warning(file, `${label}: card not found (card not entered yet)`);
        if (!catalog.imageSources[image.source]) error(file, `${label}: unknown source "${image.source}"`);
        const { name, problem } = checkImageUrl(image.url);
        if (problem) error(file, `${label}: ${problem}`);
        // Fandom names the US game's images -FMR-EN-VG, Yugipedia -FMR-NA-VG.
        if (!/-FMR-(EN|NA)-VG\.png$/.test(name)) warning(file, `${label}: "${name}" is not a -FMR-EN/NA-VG.png file`);
        const { crop } = image;
        if (crop && (!image.width || !image.height)) error(file, `${label}: a crop needs the image's width and height`);
        else if (crop && (crop.x + crop.width > image.width! || crop.y + crop.height > image.height!)) {
            error(file, `${label}: crop goes outside the ${image.width} × ${image.height} image`);
        }
    }
    catalog.images.sort((a, b) => a.card - b.card);

    const duelistNumbers = new Map<number, string>();
    for (const duelist of catalog.duelists) {
        const file = duelistFile.get(duelist)!;
        const other = duelistNumbers.get(duelist.number);
        if (other) error(file, `number ${duelist.number} is also used by ${other}`);
        else duelistNumbers.set(duelist.number, file);
        const { portrait } = duelist;
        if (!catalog.imageSources[portrait.source]) error(file, `portrait: unknown source "${portrait.source}"`);
        const { problem } = checkImageUrl(portrait.url);
        if (problem) error(file, `portrait: ${problem}`);

        const { deck, drops } = catalog.duelistPools[duelist.id];
        const pools: [string, IPoolEntry[]][] = [
            ["deck", deck],
            ...DROP_RANKS.map((rank): [string, IPoolEntry[]] => [`drops.${rank}`, drops[rank]]),
        ];
        for (const [label, pool] of pools) {
            const seen = new Set<CardId>();
            for (const { card } of pool) {
                if (seen.has(card)) error(file, `${label}: card ${card} is listed more than once`);
                seen.add(card);
                if (inRange(file, `${label}: card`, card) && !byId.has(card))
                    warning(file, `${label}: card ${card} not found (card not entered yet)`);
            }
            const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
            if (total !== totalWeight) error(file, `${label}: weights add up to ${total}, expected ${totalWeight}`);
        }
    }
    catalog.duelists.sort((a, b) => a.number - b.number);

    catalog.cards.sort((a, b) => a.id - b.id);
    const hasErrors = issues.some((issue) => issue.level === "error");
    return { issues, catalog: hasErrors ? undefined : catalog };
};

/**
 * The file name in a wiki image URL, and a problem when its md5 folder (<h>/<hh>) does not match the name
 * (spec 08). The host and shape of the URL are checked by the schema (IMAGE_URLS).
 */
const checkImageUrl = (url: string) => {
    const [, h, hh, name] = IMAGE_URLS.map((pattern) => pattern.exec(url)).find(Boolean)!;
    const md5 = createHash("md5").update(decodeURIComponent(name)).digest("hex");
    const expected = `${md5[0]}/${md5.slice(0, 2)}`;
    const problem =
        `${h}/${hh}` === expected ? undefined : `folder ${h}/${hh} does not match the file name (expected ${expected})`;
    return { name, problem };
};

export const formatIssue = (issue: Issue) => `${issue.level}: ${issue.file}: ${issue.message}`;
