import { cards } from "../data/catalog.generated";
import type { CardId, IMonsterCard, TCardType, TMonsterType } from "../data/card-types";

export const getCardList = () => cards;

export const getCard = (id: CardId) => cards.find((card) => card.id === id);

export const getCardsByType = (cardType: TCardType) => cards.filter((card) => card.cardType === cardType);

export const getCardsByMonsterType = (monsterType: TMonsterType) =>
    cards.filter((card): card is IMonsterCard => card.cardType === "Monster" && card.monsterType === monsterType);
