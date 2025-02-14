import cards from '../data/cards';
import type { TCardType, TMonsterType } from '../data/card-types';

export const getCardList = () => cards;

export const getCard = (id: number) => cards.find((card) => card.id === id);

export const getCardsByType = (cardType: TCardType) => cards.filter((card) => card.cardType === cardType);

export const getCardsByMonsterType = (monsterType: TMonsterType) => cards.filter((card) => card.cardType === 'Monster' && card.monsterType === monsterType);
