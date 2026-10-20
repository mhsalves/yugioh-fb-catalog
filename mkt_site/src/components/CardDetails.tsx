import { useEffect, useRef } from "react";
import { getCard, type CardId } from "@mhsalves/yugioh-fb-catalog";
import CardInfo from "./CardInfo";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";
import ShareButton from "./ShareButton";

interface CardDetailsProps {
    /** The open card; undefined hides the panel. */
    cardId?: CardId;
    /** Neighbours in the current results, for previous / next. */
    prevId?: CardId;
    nextId?: CardId;
    onSelect: (id: CardId) => void;
    onClose: () => void;
}

/** Keys typed into a field belong to the field, not to the panel's shortcuts. */
const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

/**
 * The details card (spec 09 C-4) as a side panel, like a file manager's details pane: the grid and filters stay
 * usable while it is open, and choosing another card swaps its content. A column on wide screens, a drawer over
 * the grid on medium ones and a full-screen view on phones (layout in styles.css).
 */
export default function CardDetails({ cardId, prevId, nextId, onSelect, onClose }: CardDetailsProps) {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const lastId = useRef<CardId | undefined>(undefined);
    const card = cardId === undefined ? undefined : getCard(cardId);

    // Move focus into the panel when it opens; on close, give it back to the card's tile.
    useEffect(() => {
        const wasOpen = lastId.current !== undefined;
        if (cardId !== undefined && !wasOpen) titleRef.current?.focus();
        if (cardId === undefined && wasOpen) {
            document.querySelector<HTMLElement>(`.card-tile[data-card-id="${lastId.current}"]`)?.focus();
        }
        lastId.current = cardId;
    }, [cardId]);

    useEffect(() => {
        if (cardId === undefined) return;
        const onKey = (event: KeyboardEvent) => {
            if (isTyping(event.target) || document.querySelector('.filters[data-open="true"]')) return;
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowLeft" && prevId !== undefined) onSelect(prevId);
            if (event.key === "ArrowRight" && nextId !== undefined) onSelect(nextId);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [cardId, prevId, nextId, onSelect, onClose]);

    if (cardId === undefined) return null;

    return (
        <aside className="card-panel" aria-labelledby="card-details-title" data-type={card?.cardType}>
            <div className="details__head">
                <h2 id="card-details-title" ref={titleRef} tabIndex={-1}>
                    <span className="details__id">#{cardId}</span> {card?.name ?? "Not catalogued yet"}
                </h2>
                <div className="details__actions">
                    {card && <ShareButton card={card} />}
                    <button type="button" className="icon-button" aria-label="Close details" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {card ? (
                <CardInfo card={card} onSelect={onSelect} />
            ) : (
                <p className="details__empty">Card #{cardId} is not in the catalog yet.</p>
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
        </aside>
    );
}
