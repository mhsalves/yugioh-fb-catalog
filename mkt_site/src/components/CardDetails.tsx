import { useEffect, useRef } from "react";
import { getCard, type CardId } from "@mhsalves/yugioh-fb-catalog";
import CardInfo from "./CardInfo";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";
import ShareButton from "./ShareButton";

interface CardDetailsProps {
    /** The open card; undefined closes the dialog. */
    cardId?: CardId;
    /** Neighbours in the current results, for previous / next. */
    prevId?: CardId;
    nextId?: CardId;
    onSelect: (id: CardId) => void;
    onClose: () => void;
}

/** The details card (spec 09 C-4): a modal dialog over the catalog page. */
export default function CardDetails({ cardId, prevId, nextId, onSelect, onClose }: CardDetailsProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const card = cardId === undefined ? undefined : getCard(cardId);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (cardId !== undefined && !dialog.open) dialog.showModal();
        if (cardId === undefined && dialog.open) dialog.close();
    }, [cardId]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (cardId === undefined) return;
            if (event.key === "ArrowLeft" && prevId !== undefined) onSelect(prevId);
            if (event.key === "ArrowRight" && nextId !== undefined) onSelect(nextId);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [cardId, prevId, nextId, onSelect]);

    return (
        <dialog
            ref={dialogRef}
            className="details"
            aria-labelledby="card-details-title"
            data-type={card?.cardType}
            // Esc closes the dialog natively; keep the URL in sync. Ignore closes caused by the URL itself.
            onClose={() => cardId !== undefined && onClose()}
            onClick={(event) => event.target === dialogRef.current && onClose()}
        >
            {cardId !== undefined && (
                <div className="details__panel">
                    <div className="details__head">
                        <h2 id="card-details-title">
                            <span className="details__id">#{cardId}</span> {card?.name ?? "Not catalogued yet"}
                        </h2>
                        <div className="details__actions">
                            {card && <ShareButton card={card} />}
                            <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {!card ? (
                        <p className="details__empty">Card #{cardId} is not in the catalog yet.</p>
                    ) : (
                        <CardInfo card={card} onSelect={onSelect} />
                    )}

                    <div className="details__nav">
                        <button
                            type="button"
                            className="button button--ghost"
                            disabled={prevId === undefined}
                            onClick={() => prevId !== undefined && onSelect(prevId)}
                        >
                            <ChevronLeftIcon /> Previous
                        </button>
                        <button
                            type="button"
                            className="button button--ghost"
                            disabled={nextId === undefined}
                            onClick={() => nextId !== undefined && onSelect(nextId)}
                        >
                            Next <ChevronRightIcon />
                        </button>
                    </div>
                </div>
            )}
        </dialog>
    );
}
