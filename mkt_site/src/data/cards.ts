import { getCardList, type ICard } from "@mhsalves/yugioh-fm-catalog";

// MOCK (spec 10 F-6, listed in ./pending.ts): the catalog cannot look a card up by password yet (proposed for the
// catalog in spec 10 F-7, as getCardByPassword or a CardQuery field). This answers from the real card list; when the
// catalog ships it, re-export it from here and delete this.

export function getCardByPassword(code: string): ICard | undefined {
    return getCardList().find((card) => card.password?.code === code);
}
