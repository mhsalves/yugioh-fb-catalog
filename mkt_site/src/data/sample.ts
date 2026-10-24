import { getCardList, type CardId, type IFusion, type IMonsterCard } from "@mhsalves/yugioh-fb-catalog";

// Sample data for the mocked catalog methods (spec 10 F-6, see ./pending.ts). Built from the real card list, so names,
// images and stats are real, but every fusion, duelist, deck and drop rate here is made up. It is generated with a
// seeded random function, so it is the same on every load, and only when a preview feature first asks for it.

/** mulberry32: a small seeded random number generator, returning numbers in [0, 1). */
function seeded(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const pick = <T>(random: () => number, list: readonly T[]): T => list[Math.floor(random() * list.length)];

const monsters = () => getCardList().filter((card): card is IMonsterCard => card.cardType === "Monster");

let fusions: IFusion[] | undefined;

/** About 300 made-up fusions: two monsters make a stronger monster of the same type as one of them. */
export function sampleFusions(): IFusion[] {
    if (fusions) return fusions;
    const random = seeded(722);
    const list = monsters();
    const byAttack = [...list].sort((a, b) => a.attack - b.attack);
    const pairs = new Map<string, IFusion>();

    for (let i = 0; i < 400; i++) {
        const a = pick(random, list);
        const b = pick(random, list);
        const floor = Math.max(a.attack, b.attack);
        const results = byAttack.filter(
            (card) => card.attack > floor && (card.monsterType === a.monsterType || card.monsterType === b.monsterType),
        );
        if (results.length === 0) continue;
        const result = results[Math.floor(random() * Math.min(4, results.length))];
        const materials: [CardId, CardId] = a.id <= b.id ? [a.id, b.id] : [b.id, a.id];
        pairs.set(materials.join("+"), { materials, result: result.id });
    }
    fusions = [...pairs.values()];
    return fusions;
}

export const SAMPLE_DROP_RANKS = ["S/A-POW", "B/C/D", "S/A-TEC"] as const;

export interface SampleDuelist {
    id: string;
    name: string;
    stage: string;
    /** Rates in percent, per rank; each list adds up to 100. */
    drops: Record<(typeof SAMPLE_DROP_RANKS)[number], { card: CardId; rate: number }[]>;
    deck: { card: CardId; rate: number }[];
}

const SAMPLE_NAMES: [string, string][] = [
    ["Sample Duelist A", "Stage 1 (sample)"],
    ["Sample Duelist B", "Stage 1 (sample)"],
    ["Sample Duelist C", "Stage 1 (sample)"],
    ["Sample Duelist D", "Stage 2 (sample)"],
    ["Sample Duelist E", "Stage 2 (sample)"],
    ["Sample Duelist F", "Stage 3 (sample)"],
];

/** `count` distinct cards with made-up weights, as rates that add up to 100 (sorted highest first). */
function sampleRates(random: () => number, count: number): { card: CardId; rate: number }[] {
    const cards = getCardList();
    const chosen = new Map<CardId, number>();
    while (chosen.size < count) chosen.set(pick(random, cards).id, 1 + Math.floor(random() * 60));
    const total = [...chosen.values()].reduce((sum, weight) => sum + weight, 0);
    return [...chosen]
        .map(([card, weight]) => ({ card, rate: (weight / total) * 100 }))
        .sort((a, b) => b.rate - a.rate);
}

let duelists: SampleDuelist[] | undefined;

export function sampleDuelists(): SampleDuelist[] {
    if (duelists) return duelists;
    duelists = SAMPLE_NAMES.map(([name, stage], index) => {
        const random = seeded(100 + index);
        return {
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            stage,
            drops: {
                "S/A-POW": sampleRates(random, 12 + Math.floor(random() * 10)),
                "B/C/D": sampleRates(random, 18 + Math.floor(random() * 12)),
                "S/A-TEC": sampleRates(random, 10 + Math.floor(random() * 8)),
            },
            deck: sampleRates(random, 30 + Math.floor(random() * 10)),
        };
    });
    return duelists;
}
