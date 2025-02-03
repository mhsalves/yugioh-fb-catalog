import type { IRitualCard } from "../card-types";

export default {
    id: 674,
    name: 'Beastry Mirror Ritual',
    description: 'Ceremony conducted to summon Fiend\'s Mirror. Sacrifice required.',
    cardType: "Ritual",
    password: {
        code: "81933259",
        cost: 100,
    },
    summon: {
        monsterResultId: 365,
        monsterMaterialIds: [186, 261, 595],
    }
} as IRitualCard;
