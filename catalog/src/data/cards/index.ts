import type { ICard } from '../card-types';

import monsters from './monsters';
import rituals from './rituals';
import support from './support';

const cards: ICard[] = ([] as ICard[]).concat(
    monsters, rituals, support,
).sort((cardA, cardB) => cardA.id > cardB.id ? 1 : -1);

export default cards;
