import { useEffect, useRef, useState } from "react";
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

/** Matches the panel-out animation in styles.css. */
const CLOSE_MS = 180;

/** Keys typed into a field belong to the field, not to the panel's shortcuts. */
const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

/**
 * The details card (spec 09 C-4) as a side panel, like a file manager's details pane: the grid and filters stay
 * usable while it is open, and choosing another card swaps its content. Docked to the window's right edge on
 * wider screens and full screen on phones; it slides in and out (layout and motion in styles.css).
 */
export default function CardDetails({ cardId, prevId, nextId, onSelect, onClose }: CardDetailsProps) {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const lastId = useRef<CardId | undefined>(undefined);

    // The panel keeps showing the last card while it slides out, then unmounts.
    const [shownId, setShownId] = useState(cardId);
    const [closing, setClosing] = useState(false);
    if (cardId !== undefined && (cardId !== shownId || closing)) {
        setShownId(cardId);
        setClosing(false);
    } else if (cardId === undefined && shownId !== undefined && !closing) {
        setClosing(true);
    }
    useEffect(() => {
        if (!closing) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const timer = window.setTimeout(
            () => {
                setShownId(undefined);
                setClosing(false);
            },
            reduced ? 0 : CLOSE_MS,
        );
        return () => window.clearTimeout(timer);
    }, [closing]);

    const card = shownId === undefined ? undefined : getCard(shownId);

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

    if (shownId === undefined) return null;

    return (
        <aside
            className="card-panel"
            aria-labelledby="card-details-title"
            data-type={card?.cardType}
            data-state={closing ? "closing" : "open"}
        >
            {/* Keyed by card, so switching cards replays the content fade. */}
            <div className="card-panel__body" key={shownId}>
                <div className="details__head">
                    <h2 id="card-details-title" ref={titleRef} tabIndex={-1}>
                        <span className="details__id">#{shownId}</span> {card?.name ?? "Not catalogued yet"}
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
                    <p className="details__empty">Card #{shownId} is not in the catalog yet.</p>
                )}
            </div>

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
