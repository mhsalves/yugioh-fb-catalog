import type { IMonsterCard } from "./types";

export default {
    id: 425,
    name: 'Thunder Dragon',
    description: 'A dragon that summons thunder and lightning to attack its opponents.',
    level: 5,
    cardType: "Monster",
    password: {
        code: "31786629",
        cost: 230,
    },
    monsterType: "Thunder",
    monsterPoints: {
        attack: 1600,
        defense: 1500,
    },
    guardianStars: {
        first: 'Pluto',
        second: 'Jupiter',
    },
} as IMonsterCard;
