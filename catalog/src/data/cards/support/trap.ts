import type { ISupportCard } from "../../card-types";

const traps: ISupportCard[] = [
    {
        id: 690,
        name: "Fake Trap",
        description: "A trap card for tricking your opponent. Nothing happens when it is attacked.",
        cardType: "Trap",
        password: {
            code: "03027001",
            cost: 999999,
        }
    },
];

export default traps;
