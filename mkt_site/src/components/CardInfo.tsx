import type { ReactNode } from "react";
import {
    getCard,
    getCardImage,
    getRitual,
    GUARDIAN_STAR_ADVANTAGE,
    type CardId,
    type ICard,
} from "@mhsalves/yugioh-fb-catalog";
import { cardPath, Link } from "../router";
import { useCopy } from "../useCopy";
import CardImage from "./CardImage";
import { CheckIcon, CopyIcon } from "./icons";

/** Opens another card: in the details dialog through `onSelect`, on the card page as a link to its page. */
type SelectCard = ((id: CardId) => void) | undefined;

/** A card id that opens its details when the card is catalogued, or plain text when it is not yet. */
function CardRef({ id, onSelect }: { id: CardId; onSelect: SelectCard }) {
    const card = getCard(id);
    if (!card) return <span className="card-ref card-ref--missing">#{id} (not catalogued yet)</span>;
    const label = `#${id} ${card.name}`;
    return onSelect ? (
        <button type="button" className="card-ref" onClick={() => onSelect(id)}>
            {label}
        </button>
    ) : (
        <Link to={cardPath(id)} className="card-ref">
            {label}
        </Link>
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

function Password({ code }: { code: string }) {
    const [state, copy] = useCopy();
    return (
        <>
            <code className="password">{code}</code>
            <button
                type="button"
                className="icon-button icon-button--small"
                aria-label={`Copy password ${code}`}
                onClick={() => copy(code)}
            >
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </>
    );
}

function Ritual({ card, onSelect }: { card: ICard; onSelect: SelectCard }) {
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

/** A card's full data (spec 09 C-4), shared by the details dialog and the shared card page (C-7). */
export default function CardInfo({ card, onSelect }: { card: ICard; onSelect?: (id: CardId) => void }) {
    const image = getCardImage(card.id);
    return (
        <>
            <figure className="details__art" data-has-image={image ? true : undefined}>
                <CardImage id={card.id} size="full" />
                <span className="type-badge" aria-hidden="true">
                    {card.cardType}
                </span>
                {image && (
                    <figcaption className="details__credit">
                        Image:{" "}
                        <a href={image.source.pageUrl} target="_blank" rel="noopener noreferrer">
                            {image.source.name}
                            <span className="visually-hidden"> (opens in a new tab)</span>
                        </a>
                    </figcaption>
                )}
            </figure>

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
                                        <span className="hint">strong against {GUARDIAN_STAR_ADVANTAGE[star]}</span>
                                    </li>
                                ))}
                            </ul>
                        </Field>
                    </>
                )}
                {card.password ? (
                    <>
                        <Field label="Password">
                            <Password code={card.password.code} />
                        </Field>
                        <Field label="Cost">{card.password.cost} starchips</Field>
                    </>
                ) : (
                    <Field label="Password">
                        <span className="hint">None: this card cannot be bought with a password</span>
                    </Field>
                )}
            </dl>

            <section className="details__section">
                <h3>Description</h3>
                <p>{card.description}</p>
            </section>

            <Ritual card={card} onSelect={onSelect} />
        </>
    );
}
