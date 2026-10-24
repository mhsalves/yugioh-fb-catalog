import { getCard, type CardId, type ICard, type IFusion } from "@mhsalves/yugioh-fb-catalog";
import { sampleFusions } from "./sample";

// MOCK (spec 10 F-6, listed in ./pending.ts): the catalog has no fusion data or look-ups yet (spec 04 Q-5). These
// functions keep the signatures planned for the catalog and answer from sample data. When the catalog ships them,
// re-export them from here and delete the mock.

/** A fusion with its cards loaded, as the fusion screens show it. */
export interface FusionView {
    materials: [ICard, ICard];
    result: ICard;
}

const attackOf = (card: ICard) => (card.cardType === "Monster" ? card.attack : 0);

function toView(fusion: IFusion): FusionView | undefined {
    const [a, b] = fusion.materials.map(getCard);
    const result = getCard(fusion.result);
    return a && b && result ? { materials: [a, b], result } : undefined;
}

/** Strongest result first, which is what players compare. */
function views(fusions: IFusion[]): FusionView[] {
    return fusions
        .map(toView)
        .filter((view): view is FusionView => view !== undefined)
        .sort((x, y) => attackOf(y.result) - attackOf(x.result) || x.result.id - y.result.id);
}

/** What two cards fuse into. Order does not matter (spec 02 TBD-D2). */
export function getFusion(a: CardId, b: CardId): ICard | undefined {
    const [low, high] = a <= b ? [a, b] : [b, a];
    const fusion = sampleFusions().find(({ materials }) => materials[0] === low && materials[1] === high);
    return fusion && getCard(fusion.result);
}

/** Every fusion a card is a material of. */
export function getFusionsWith(id: CardId): FusionView[] {
    return views(sampleFusions().filter(({ materials }) => materials.includes(id)));
}

/** Every fusion that makes this card. */
export function getFusionsFor(resultId: CardId): FusionView[] {
    return views(sampleFusions().filter(({ result }) => result === resultId));
}

/** One pair from the sample data, for the "Try a sample pair" button. */
export const sampleFusionPair = (): [CardId, CardId] => sampleFusions()[0].materials;
