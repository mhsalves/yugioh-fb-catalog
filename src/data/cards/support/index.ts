import type { ISupportCard } from '../../card-types';
import equip from './equip';
import magic from './magic';
import trap from './trap';

const supportCards: ISupportCard[] = ([] as ISupportCard[]).concat(equip, magic, trap);

export default supportCards;
