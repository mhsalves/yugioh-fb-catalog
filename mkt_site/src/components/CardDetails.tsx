import { useEffect, useRef, type ReactNode } from "react";
import { getCard, getRitual, GUARDIAN_STAR_ADVANTAGE, type CardId, type ICard } from "@mhsalves/yugioh-fb-catalog";
import { useCopy } from "../useCopy";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, CopyIcon } from "./icons";

interface CardDetailsProps {
    /** The open card; undefined closes the dialog. */
    cardId?: CardId;
    /** Neighbours in the current results, for previous / next. */
    prevId?: CardId;
    nextId?: CardId;
    onSelect: (id: CardId) => void;
    onClose: () => void;
}

/** A card id that opens its details when the card is catalogued, or plain text when it is not yet. */
function CardRef({ id, onSelect }: { id: CardId; onSelect: (id: CardId) => void }) {
    const card = getCard(id);
    if (!card) return <span className="card-ref card-ref--missing">#{id} (not catalogued yet)</span>;
    return (
        <button type="button" className="card-ref" onClick={() => onSelect(id)}>
            #{id} {card.name}
        </button>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="field">
            <dt>{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function Password({ card }: { card: ICard }) {
    const [state, copy] = useCopy();
    return (
        <>
            <code className="password">{card.password.code}</code>
            <button
                type="button"
                className="icon-button icon-button--small"
                aria-label={`Copy password ${card.password.code}`}
                onClick={() => copy(card.password.code)}
            >
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </>
    );
}

function Ritual({ card, onSelect }: { card: ICard; onSelect: (id: CardId) => void }) {
    const ritual = getRitual(card.id);
    if (!ritual) return null;

    return (
        <section className="details__section">
            <h3>Ritual</h3>
            <dl className="fields">
                {card.id === ritual.ritual ? (
                    <Field label="Summons">
                        <CardRef id={ritual.result} onSelect={onSelect} />
                    </Field>
                ) : (
                    <Field label="Summoned by">
                        <CardRef id={ritual.ritual} onSelect={onSelect} />
                    </Field>
                )}
                <Field label="Sacrifices">
                    <ul className="card-refs">
                        {ritual.materials.map((id) => (
                            <li key={id}>
                                <CardRef id={id} onSelect={onSelect} />
                            </li>
                        ))}
                    </ul>
                </Field>
            </dl>
        </section>
    );
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
                        <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>

                    {!card ? (
                        <p className="details__empty">Card #{cardId} is not in the catalog yet.</p>
                    ) : (
                        <>
                            <div className="details__art" aria-hidden="true">
                                <span className="type-badge">{card.cardType}</span>
                            </div>

                            <dl className="fields">
                                <Field label="Card type">{card.cardType}</Field>
                                {card.cardType === "Monster" && (
                                    <>
                                        <Field label="Monster type">{card.monsterType}</Field>
                                        <Field label="Level">{card.level}</Field>
                                        <Field label="ATK / DEF">
                                            {card.attack} / {card.defense}
                                        </Field>
                                        <Field label="Guardian stars">
                                            <ul className="stars">
                                                {card.guardianStars.map((star) => (
                                                    <li key={star}>
                                                        <strong>{star}</strong>{" "}
                                                        <span className="hint">
                                                            strong against {GUARDIAN_STAR_ADVANTAGE[star]}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Field>
                                    </>
                                )}
                                <Field label="Password">
                                    <Password card={card} />
                                </Field>
                                <Field label="Cost">{card.password.cost} starchips</Field>
                            </dl>

                            <section className="details__section">
                                <h3>Description</h3>
                                <p>{card.description}</p>
                            </section>

                            <Ritual card={card} onSelect={onSelect} />
                        </>
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
