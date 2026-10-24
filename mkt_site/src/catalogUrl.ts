import {
    CARD_TYPES,
    GUARDIAN_STARS,
    MONSTER_TYPES,
    type CardId,
    type CardQuery,
    type CardSortKey,
    type NumberRange,
} from "@mhsalves/yugioh-fb-catalog";

// The catalog page keeps its whole state in the query string (spec 09 C-6), for example
// ?q=dragon&type=Monster&mtype=Dragon,Thunder&star=Sun&atk=1000-&sort=attack-desc&page=2&card=425

export const SORT_KEYS: readonly CardSortKey[] = ["id", "name", "attack", "defense", "level", "cost"];

export interface CatalogState {
    query: CardQuery;
    /** The card open in the details card. */
    cardId?: CardId;
    /** Results page, from 1; left out for the first page. */
    page?: number;
}

const RANGE_PARAMS = { level: "level", attack: "atk", defense: "def", cost: "cost" } as const;
export type RangeField = keyof typeof RANGE_PARAMS;

function parseList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
    if (!value) return [];
    return value.split(",").filter((item): item is T => (allowed as readonly string[]).includes(item));
}

function parseNumber(value: string): number | undefined {
    if (value.trim() === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function parseRange(value: string | null): NumberRange | undefined {
    if (!value) return undefined;
    const [min = "", max = ""] = value.split("-");
    const range = { min: parseNumber(min), max: parseNumber(max) };
    return range.min === undefined && range.max === undefined ? undefined : range;
}

function formatRange(range?: NumberRange): string | undefined {
    if (!range || (range.min === undefined && range.max === undefined)) return undefined;
    return `${range.min ?? ""}-${range.max ?? ""}`;
}

const asList = <T>(value: T | T[] | undefined): T[] =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

const MONSTER_RANGES = ["level", "attack", "defense"] as const;

/** Whether any monster-only field (monster type, guardian star, level, ATK, DEF) is set. */
export function hasMonsterFilters(query: CardQuery): boolean {
    return (
        asList(query.monsterType).length > 0 ||
        asList(query.guardianStar).length > 0 ||
        MONSTER_RANGES.some((field) => formatRange(query[field]) !== undefined)
    );
}

/** Monster filters are only enabled while "Monster" is selected in "By type" (owner request, 2026-10-23). */
export const monstersSelected = (query: CardQuery): boolean => asList(query.cardType).includes("Monster");

/** Drops the monster-only fields, for when "Monster" is no longer selected. */
export function withoutMonsterFilters(query: CardQuery): CardQuery {
    const next = { ...query };
    delete next.monsterType;
    delete next.guardianStar;
    for (const field of MONSTER_RANGES) delete next[field];
    return next;
}

/**
 * Keeps a URL's query in line with that rule: monster filters with no card type select "Monster" (older links such
 * as ?atk=1000- keep working); monster filters with other card types only are dropped.
 */
function applyMonsterRule(query: CardQuery): CardQuery {
    if (!hasMonsterFilters(query) || monstersSelected(query)) return query;
    return asList(query.cardType).length === 0 ? { ...query, cardType: ["Monster"] } : withoutMonsterFilters(query);
}

export function parseCatalogUrl(search: string): CatalogState {
    const params = new URLSearchParams(search);
    const query: CardQuery = {};

    const text = params.get("q");
    if (text) query.text = text;
    if (params.get("desc") === "1") query.includeDescription = true;

    const cardType = parseList(params.get("type"), CARD_TYPES);
    if (cardType.length) query.cardType = cardType;
    const monsterType = parseList(params.get("mtype"), MONSTER_TYPES);
    if (monsterType.length) query.monsterType = monsterType;
    const guardianStar = parseList(params.get("star"), GUARDIAN_STARS);
    if (guardianStar.length) query.guardianStar = guardianStar;

    for (const [field, param] of Object.entries(RANGE_PARAMS) as [RangeField, string][]) {
        const range = parseRange(params.get(param));
        if (range) query[field] = range;
    }

    const [by, dir] = (params.get("sort") ?? "").split("-");
    if ((SORT_KEYS as readonly string[]).includes(by)) {
        query.sort = { by: by as CardSortKey, dir: dir === "desc" ? "desc" : "asc" };
    }

    const cardId = parseNumber(params.get("card") ?? "");
    const page = parseNumber(params.get("page") ?? "");
    return {
        query: applyMonsterRule(query),
        cardId: cardId !== undefined && Number.isInteger(cardId) ? cardId : undefined,
        page: page !== undefined && Number.isInteger(page) && page > 1 ? page : undefined,
    };
}

/** Builds "/?…" for the catalog page, leaving out empty fields so the plain catalog URL stays "/". */
export function catalogUrl({ query, cardId, page }: CatalogState): string {
    const parts: [string, string | undefined][] = [
        ["q", query.text?.trim() || undefined],
        ["desc", query.includeDescription ? "1" : undefined],
        ["type", asList(query.cardType).join(",") || undefined],
        ["mtype", asList(query.monsterType).join(",") || undefined],
        ["star", asList(query.guardianStar).join(",") || undefined],
        ...(Object.entries(RANGE_PARAMS) as [RangeField, string][]).map(
            ([field, param]): [string, string | undefined] => [param, formatRange(query[field])],
        ),
        [
            "sort",
            query.sort && (query.sort.by !== "id" || query.sort.dir === "desc")
                ? `${query.sort.by}-${query.sort.dir ?? "asc"}`
                : undefined,
        ],
        ["page", page !== undefined && page > 1 ? String(page) : undefined],
        ["card", cardId?.toString()],
    ];
    // Commas stay readable; everything else is encoded.
    const search = parts
        .filter((part): part is [string, string] => part[1] !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%2C/g, ",")}`)
        .join("&");
    return search ? `/?${search}` : "/";
}

export interface ActiveFilter {
    id: string;
    label: string;
    /** The query without this filter. */
    without: CardQuery;
}

const RANGE_LABELS: Record<RangeField, string> = { level: "Level", attack: "ATK", defense: "DEF", cost: "Cost" };

function rangeLabel(name: string, { min, max }: NumberRange): string {
    if (min !== undefined && max !== undefined) return min === max ? `${name} ${min}` : `${name} ${min}–${max}`;
    return min !== undefined ? `${name} ≥ ${min}` : `${name} ≤ ${max}`;
}

/**
 * The filter-panel fields that are set, one removable chip each (shown above the results so the panel need not be
 * opened to see or undo them). Same fields as countFilters.
 */
export function activeFilters(query: CardQuery): ActiveFilter[] {
    const filters: ActiveFilter[] = [];
    const monsterTypes = asList(query.monsterType);
    for (const type of monsterTypes) {
        filters.push({
            id: `mtype-${type}`,
            label: type,
            without: { ...query, monsterType: monsterTypes.filter((item) => item !== type) },
        });
    }
    const stars = asList(query.guardianStar);
    for (const star of stars) {
        filters.push({
            id: `star-${star}`,
            label: `${star} star`,
            without: { ...query, guardianStar: stars.filter((item) => item !== star) },
        });
    }
    for (const field of Object.keys(RANGE_PARAMS) as RangeField[]) {
        const range = query[field];
        if (formatRange(range) === undefined) continue;
        filters.push({
            id: field,
            label: rangeLabel(RANGE_LABELS[field], range!),
            without: { ...query, [field]: undefined },
        });
    }
    if (query.includeDescription) {
        filters.push({
            id: "desc",
            label: "Text in descriptions",
            without: { ...query, includeDescription: undefined },
        });
    }
    return filters;
}

/** How many filter-panel fields are set: not the search text, the "By type" row or the sort (shown on the phone "Filters" button). */
export function countFilters(query: CardQuery): number {
    return (
        asList(query.monsterType).length +
        asList(query.guardianStar).length +
        (Object.keys(RANGE_PARAMS) as RangeField[]).filter((field) => formatRange(query[field]) !== undefined).length +
        (query.includeDescription ? 1 : 0)
    );
}
