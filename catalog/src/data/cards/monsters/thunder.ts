import type { MonsterCardsOf } from "./index";

const thunder: MonsterCardsOf<"Thunder"> = [
    {
        id: 425,
        name: "Thunder Dragon",
        description: "A dragon that summons thunder and lightning to attack its opponents.",
        cardType: "Monster",
        password: {
            code: "31786629",
            cost: 230,
        },
        monsterType: "Thunder",
        level: 5,
        attack: 1600,
        defense: 1500,
        guardianStars: ["Pluto", "Jupiter"],
    },
];

export default thunder;
