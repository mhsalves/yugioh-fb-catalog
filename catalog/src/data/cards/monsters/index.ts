import type { IMonsterCard, TMonsterType } from "../../card-types";

import thunder from "./thunder";

/** Cards in monsters/<type>.ts must all have that monsterType (a mismatch is a type error). */
export type MonsterCardsOf<T extends TMonsterType> = (IMonsterCard & { monsterType: T })[];

/** One file per monster type (spec 02 D-5). Add a type's file here when its first card is entered. */
const monsters: IMonsterCard[] = ([] as IMonsterCard[]).concat(thunder);

export default monsters;
