import type { IRitualCard } from '../../card-types';
import page0 from './page0';
import page1 from './page1';
import page2 from './page2';
import page3 from './page3';

const supportCards: IRitualCard[] = ([] as IRitualCard[]).concat(page0, page1, page2, page3);

export default supportCards;
