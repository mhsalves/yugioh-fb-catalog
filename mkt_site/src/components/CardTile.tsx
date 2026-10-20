import type { ICard } from "@mhsalves/yugioh-fb-catalog";

/** One grid item (spec 09 C-3). The art area is a styled frame until card images land (spec 08). */
export default function CardTile({ card, onOpen }: { card: ICard; onOpen: (id: number) => void }) {
    const isMonster = card.cardType === "Monster";

    return (
        <button
            type="button"
            className="card-tile"
            data-type={card.cardType}
            data-card-id={card.id}
            aria-label={`${card.name}, #${card.id}, ${card.cardType}`}
            onClick={() => onOpen(card.id)}
        >
            <span className="card-tile__art" aria-hidden="true">
                <span className="card-tile__id">#{card.id}</span>
                <span className="type-badge">{card.cardType}</span>
            </span>
            <span className="card-tile__body">
                <span className="card-tile__name">{card.name}</span>
                {isMonster ? (
                    <>
                        <span className="card-tile__meta">
                            {card.monsterType} · Lv {card.level}
                        </span>
                        <span className="card-tile__stats">
                            {card.attack} / {card.defense}
                        </span>
                    </>
                ) : (
                    <span className="card-tile__meta">Cost {card.password.cost}</span>
                )}
            </span>
        </button>
    );
}
