import { z } from "zod";

import type { IEquipCard, IMagicCard, IMonsterCard, IPassword, IRitualCard, ITrapCard } from "../src/data/card-types";
import { GUARDIAN_STARS, MONSTER_TYPES } from "../src/data/enums";
import type { IEquipCompat, IFieldEffect, IFusion, IRitual } from "../src/data/relation-types";
import type { IGameRules } from "../src/data/rules";

/**
 * Schemas for the JSON files in catalog/data (spec 03 A-1). Dev-only: they validate the data
 * (scripts/validate.ts, scripts/build-data.ts) and export the JSON Schemas in this folder that
 * the data files point to with "$schema". The public TS types stay hand-written in src/data and
 * are checked against these schemas at the bottom of this file, so the two cannot drift.
 */

const nonBlank = z.string().regex(/\S/, "must not be blank");

/** In-game card number. The upper bound (rules.json totalCards) is checked by the validator. */
const CardId = z.int().min(1);
const MonsterType = z.enum(MONSTER_TYPES);
const GuardianStar = z.enum(GUARDIAN_STARS);

const Password = z.strictObject({
    code: z.string().regex(/^\d{8}$/, "must be 8 digits"),
    cost: z.int().min(0).max(999999),
});

const cardBase = {
    id: CardId,
    name: nonBlank,
    description: z.string(),
};

export const MonsterCard = z.strictObject({
    ...cardBase,
    cardType: z.literal("Monster"),
    password: Password,
    monsterType: MonsterType,
    level: z.int().min(1).max(12),
    attack: z.int().min(0),
    defense: z.int().min(0),
    guardianStars: z.tuple([GuardianStar, GuardianStar]),
});
export const MagicCard = z.strictObject({ ...cardBase, cardType: z.literal("Magic"), password: Password });
export const TrapCard = z.strictObject({ ...cardBase, cardType: z.literal("Trap"), password: Password });
export const EquipCard = z.strictObject({ ...cardBase, cardType: z.literal("Equip"), password: Password });
export const RitualCard = z.strictObject({ ...cardBase, cardType: z.literal("Ritual"), password: Password });

export const Ritual = z.strictObject({
    ritual: CardId,
    result: CardId,
    materials: z.array(CardId).min(1),
});
export const Fusion = z.strictObject({
    materials: z.tuple([CardId, CardId]),
    result: CardId,
});
export const EquipCompat = z.strictObject({
    equip: CardId,
    targets: z.array(CardId),
    boost: z.int().min(0),
});
export const FieldEffect = z.strictObject({
    field: CardId,
    boosts: z.array(MonsterType),
    weakens: z.array(MonsterType),
    amount: z.int().min(0),
});
export const GameRules = z.strictObject({
    totalCards: z.int().min(1),
    guardianStarAdvantage: z.record(GuardianStar, GuardianStar),
    guardianStarBonus: z.int().min(0),
});

/** Every data file is an object with "$schema" and one array (or, for rules.json, the rule values). */
const listFile = <K extends string, T extends z.ZodType>(key: K, item: T) =>
    z.strictObject({ $schema: z.string(), [key]: z.array(item) } as { $schema: z.ZodString } & Record<
        K,
        z.ZodArray<T>
    >);

/** One entry per JSON Schema file in catalog/schema. `name` is the file name without ".schema.json". */
export const FILE_SCHEMAS = {
    "monster-list": listFile("cards", MonsterCard),
    "magic-list": listFile("cards", MagicCard),
    "trap-list": listFile("cards", TrapCard),
    "equip-list": listFile("cards", EquipCard),
    "ritual-list": listFile("cards", RitualCard),
    rituals: listFile("rituals", Ritual),
    fusions: listFile("fusions", Fusion),
    equips: listFile("equips", EquipCompat),
    fields: listFile("fields", FieldEffect),
    rules: GameRules.extend({ $schema: z.string() }),
} as const;

export type SchemaName = keyof typeof FILE_SCHEMAS;

/** JSON Schema (draft-07, the draft editors support best) for one data file kind. */
export const toJsonSchema = (name: SchemaName) =>
    z.toJSONSchema(FILE_SCHEMAS[name], { target: "draft-7", io: "input" }) as Record<string, unknown>;

/** Content of catalog/schema/<name>.schema.json. */
export const renderJsonSchema = (name: SchemaName) => `${JSON.stringify(toJsonSchema(name), null, 2)}\n`;

// The public types in src/data must match what the schemas accept (a mismatch is a type error here).
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const same = <T extends true>(): T | undefined => undefined;
same<Same<z.infer<typeof Password>, IPassword>>();
same<Same<z.infer<typeof MonsterCard>, IMonsterCard>>();
same<Same<z.infer<typeof MagicCard>, IMagicCard>>();
same<Same<z.infer<typeof TrapCard>, ITrapCard>>();
same<Same<z.infer<typeof EquipCard>, IEquipCard>>();
same<Same<z.infer<typeof RitualCard>, IRitualCard>>();
same<Same<z.infer<typeof Ritual>, IRitual>>();
same<Same<z.infer<typeof Fusion>, IFusion>>();
same<Same<z.infer<typeof EquipCompat>, IEquipCompat>>();
same<Same<z.infer<typeof FieldEffect>, IFieldEffect>>();
same<Same<z.infer<typeof GameRules>, IGameRules>>();
