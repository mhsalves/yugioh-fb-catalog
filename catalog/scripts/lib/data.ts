import fs from "fs";
import path from "path";

import { FILE_SCHEMAS, type SchemaName } from "../../schema/schemas";
import type { CardId, ICard, TMonsterType } from "../../src/data/card-types";
import { MONSTER_TYPES } from "../../src/data/enums";
import type { IEquipCompat, IFieldEffect, IFusion, IRitual } from "../../src/data/relation-types";
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
};

/** The kind of a data file from its path, or an error message when the path is not part of the layout. */
export const fileKind = (file: string): FileKind | string => {
    if (FIXED_FILES[file]) return { schema: FIXED_FILES[file] };
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
    const catalog: Catalog = { cards: [], rituals: [], fusions: [], equips: [], fields: [], rules: undefined! };
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
    const { totalCards } = catalog.rules;
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

    catalog.cards.sort((a, b) => a.id - b.id);
    const hasErrors = issues.some((issue) => issue.level === "error");
    return { issues, catalog: hasErrors ? undefined : catalog };
};

export const formatIssue = (issue: Issue) => `${issue.level}: ${issue.file}: ${issue.message}`;
