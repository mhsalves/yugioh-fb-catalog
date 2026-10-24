import { CARD_TYPES, MONSTER_TYPES } from "../src/data/enums";
import { formatIssue, readDataDir, validateData } from "./lib/data";

/**
 * Prints how much of the game has been entered (spec 03 A-4): cards per card type and monster type,
 * relation records, and the overall count against rules.json totalCards.
 */
const { issues, catalog } = validateData(readDataDir());
if (!catalog) {
    for (const issue of issues) console.error(formatIssue(issue));
    process.exit(1);
}

const { cards, rules } = catalog;
const percent = (count: number) => `${((count / rules.totalCards) * 100).toFixed(1)}%`;

console.log(`Cards: ${cards.length} / ${rules.totalCards} (${percent(cards.length)})`);
for (const cardType of CARD_TYPES) {
    console.log(`  ${cardType.padEnd(13)} ${cards.filter((card) => card.cardType === cardType).length}`);
    if (cardType !== "Monster") continue;
    for (const monsterType of MONSTER_TYPES) {
        const count = cards.filter((card) => card.cardType === "Monster" && card.monsterType === monsterType).length;
        if (count) console.log(`    ${monsterType.padEnd(13)} ${count}`);
    }
}
console.log("Relations:");
console.log(`  Rituals       ${catalog.rituals.length}`);
console.log(`  Fusions       ${catalog.fusions.length}`);
console.log(`  Equips        ${catalog.equips.length}`);
console.log(`  Fields        ${catalog.fields.length}`);
console.log(`Duelists:       ${catalog.duelists.length}`);
