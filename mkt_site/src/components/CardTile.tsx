import type { ICard } from "@mhsalves/yugioh-fm-catalog";
import CardImage from "./CardImage";

/** One grid item (spec 09 C-3). The art area shows the card's image (spec 08), or a styled frame without one. */
export default function CardTile(props: { card: ICard; onOpen: (id: number) => void; selected?: boolean }) {
    const { card, onOpen, selected = false } = props;
    const isMonster = card.cardType === "Monster";

    return (
        <button
            type="button"
            className="card-tile"
            data-type={card.cardType}
            data-card-id={card.id}
            aria-current={selected || undefined}
            aria-label={`${card.name}, #${card.id}, ${card.cardType}`}
            onClick={() => onOpen(card.id)}
        >
            <span className="card-tile__art" aria-hidden="true">
                {/* Tiles are about 220 px wide: the 160 px thumbnail, or the full image on dense screens. */}
                <CardImage id={card.id} size="thumb" sizes="(max-width: 600px) 45vw, 220px" />
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
                    <span className="card-tile__meta">
                        {card.password ? `Cost ${card.password.cost}` : "No password"}
                    </span>
                )}
            </span>
        </button>
    );
}
