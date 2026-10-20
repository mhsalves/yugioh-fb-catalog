import type { ICard } from "../card-types";

import equip from "./equip";
import magic from "./magic";
import monsters from "./monsters";
import ritual from "./ritual";
import trap from "./trap";

/** Every card, sorted by id. Files are split by card type only (spec 02 D-5); the sort restores id order. */
const cards: ICard[] = ([] as ICard[])
    .concat(monsters, magic, trap, equip, ritual)
    .sort((cardA, cardB) => cardA.id - cardB.id);

export default cards;
