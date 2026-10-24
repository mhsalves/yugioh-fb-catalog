import type { ReactNode } from "react";
import {
    getCard,
    getCardImage,
    getRitual,
    GUARDIAN_STAR_ADVANTAGE,
    type CardId,
    type ICard,
} from "@mhsalves/yugioh-fb-catalog";
import { getDroppedBy } from "../data/duelists";
import { getFusionsFor, getFusionsWith } from "../data/fusions";
import { isRouteVisible } from "../features";
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

const RELATION_LIMIT = 5;

/** Fusions the card is in (spec 10 F-5), while the fusion tool is visible. Sample data until spec 04 Q-5. */
function Fusions({ card, onSelect }: { card: ICard; onSelect: SelectCard }) {
    if (!isRouteVisible("fusion")) return null;
    const madeFrom = getFusionsFor(card.id).slice(0, RELATION_LIMIT);
    const uses = getFusionsWith(card.id).slice(0, RELATION_LIMIT);
    if (madeFrom.length === 0 && uses.length === 0) return null;

    return (
        <section className="details__section">
            <h3>
                Fusions <span className="sample-tag">Sample data</span>
            </h3>
            <dl className="fields">
                {madeFrom.length > 0 && (
                    <Field label="Made from">
                        <ul className="card-refs">
                            {madeFrom.map(({ materials: [a, b] }) => (
                                <li key={`${a.id}+${b.id}`}>
                                    <CardRef id={a.id} onSelect={onSelect} /> +{" "}
                                    <CardRef id={b.id} onSelect={onSelect} />
                                </li>
                            ))}
                        </ul>
                    </Field>
                )}
                {uses.length > 0 && (
                    <Field label="Fuses into">
                        <ul className="card-refs">
                            {uses.map(({ materials, result }) => {
                                const partner = materials[0].id === card.id ? materials[1] : materials[0];
                                return (
                                    <li key={`${partner.id}>${result.id}`}>
                                        + <CardRef id={partner.id} onSelect={onSelect} /> →{" "}
                                        <CardRef id={result.id} onSelect={onSelect} />
                                    </li>
                                );
                            })}
                        </ul>
                    </Field>
                )}
            </dl>
            <Link to={`/fusion?mode=with&of=${card.id}`} className="details__more">
                Every fusion with this card
            </Link>
        </section>
    );
}

/** Duelists that drop the card (spec 10 F-5), while the duelist pages are visible. Sample data until TBD-D9. */
function DroppedBy({ card }: { card: ICard }) {
    if (!isRouteVisible("duelists")) return null;
    const drops = getDroppedBy(card.id).slice(0, RELATION_LIMIT);
    if (drops.length === 0) return null;

    return (
        <section className="details__section">
            <h3>
                Dropped by <span className="sample-tag">Sample data</span>
            </h3>
            <ul className="card-refs">
                {drops.map((drop) => (
                    <li key={`${drop.duelist.id}-${drop.rank}`}>
                        <Link to={`/duelists/${drop.duelist.id}`}>{drop.duelist.name}</Link>{" "}
                        <span className="hint">
                            {drop.rank} · {drop.rate.toFixed(2)}%
                        </span>
                    </li>
                ))}
            </ul>
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
            <Fusions card={card} onSelect={onSelect} />
            <DroppedBy card={card} />
        </>
    );
}
