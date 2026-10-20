import type { IRitualCard } from "../card-types";

/** Ritual cards. Each recipe (result and materials) is in ../rituals.ts. */
const ritual: IRitualCard[] = [
    {
        id: 674,
        name: "Beastry Mirror Ritual",
        description: "Ceremony conducted to summon Fiend's Mirror. Sacrifice required.",
        cardType: "Ritual",
        password: {
            code: "81933259",
            cost: 100,
        },
    },
];

export default ritual;
