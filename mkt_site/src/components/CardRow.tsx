import type { ReactNode } from "react";
import type { CardId, ICard } from "@mhsalves/yugioh-fb-catalog";
import CardImage from "./CardImage";

/**
 * A compact one-line card (spec 10 F-4), denser than a grid tile, for lists on phones: search results, fusions,
 * deck and drop lists. The whole row is one button that opens the card's details. `children` replace the stats on
 * the right (a drop rate, for example).
 */
export default function CardRow({
    card,
    onOpen,
    children,
}: {
    card: ICard;
    onOpen: (id: CardId) => void;
    children?: ReactNode;
}) {
    const isMonster = card.cardType === "Monster";
    return (
        <button
            type="button"
            className="card-row"
            data-type={card.cardType}
            data-card-id={card.id}
            onClick={() => onOpen(card.id)}
        >
            <span className="card-row__art" aria-hidden="true">
                <CardImage id={card.id} size="thumb" />
            </span>
            <span className="card-row__main">
                <span className="card-row__name">{card.name}</span>
                <span className="card-row__meta">
                    #{card.id} · {isMonster ? `${card.monsterType} · Lv ${card.level}` : card.cardType}
                </span>
            </span>
            <span className="card-row__end">
                {children ??
                    (isMonster && <span className="card-row__stats">{`${card.attack} / ${card.defense}`}</span>)}
            </span>
        </button>
    );
}
