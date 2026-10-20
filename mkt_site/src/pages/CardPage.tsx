import { useEffect } from "react";
import { getCard, type CardId } from "@mhsalves/yugioh-fb-catalog";
import CardInfo from "../components/CardInfo";
import { ChevronLeftIcon } from "../components/icons";
import ShareButton from "../components/ShareButton";
import { Link } from "../router";

/**
 * A card's own page at /cards/<id>/ (spec 09 C-7). People reach it through a shared link (the Share button in
 * the catalog's details card); it shows the card on its own, with a way back to the catalog.
 */
export default function CardPage({ id }: { id: CardId }) {
    const card = getCard(id);

    useEffect(() => {
        document.title = `${card?.name ?? `Card #${id}`} · Yu-Gi-Oh! FM Catalog`;
    }, [card, id]);

    return (
        <article className="card-page" data-type={card?.cardType} aria-labelledby="card-page-title">
            <Link to="/" className="back-link">
                <ChevronLeftIcon /> Back to the catalog
            </Link>

            <div className="card-page__panel">
                <div className="details__head">
                    <h1 id="card-page-title">
                        <span className="details__id">#{id}</span> {card?.name ?? "Not catalogued yet"}
                    </h1>
                    {card && <ShareButton card={card} />}
                </div>

                {card ? (
                    <CardInfo card={card} />
                ) : (
                    <p className="details__empty">Card #{id} is not in the catalog yet.</p>
                )}

                <div className="details__nav">
                    <Link to="/" className="button">
                        Browse the full catalog
                    </Link>
                </div>
            </div>
        </article>
    );
}
