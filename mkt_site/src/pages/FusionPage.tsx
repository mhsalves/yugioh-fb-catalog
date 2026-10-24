import { useEffect, useState } from "react";
import { getCard, type CardId, type CardQuery } from "@mhsalves/yugioh-fb-catalog";
import CardImage from "../components/CardImage";
import CardPicker from "../components/CardPicker";
import CardRow from "../components/CardRow";
import EmptyState from "../components/EmptyState";
import { CloseIcon, PlusIcon, SwapIcon } from "../components/icons";
import PageCardDetails from "../components/PageCardDetails";
import PreviewBanner from "../components/PreviewBanner";
import Tabs, { tabPanelProps } from "../components/Tabs";
import { getFusion, getFusionsFor, getFusionsWith, sampleFusionPair } from "../data/fusions";
import { SITE_TITLE } from "../routes";
import { useCardParam, useUrlParams } from "../urlParams";

type Mode = "combine" | "with" | "for";
type SlotName = "a" | "b" | "of";

const MODES = [
    { id: "combine", label: "Combine" },
    { id: "with", label: "Uses" },
    { id: "for", label: "Recipes" },
] as const satisfies readonly { id: Mode; label: string }[];

/** Fusions are between monsters: a fixed limit on the picker, not a user filter (spec 10 F-7). */
const MONSTERS: CardQuery = { cardType: "Monster" };

const PICKER_TITLES: Record<SlotName, string> = {
    a: "First material",
    b: "Second material",
    of: "Choose a card",
};

function parseId(value: string | null): CardId | undefined {
    const id = Number(value ?? "");
    return Number.isInteger(id) && getCard(id) ? id : undefined;
}

/** A material or look-up slot: tap to pick a card, with a clear button once one is picked. */
function Slot(props: { label: string; id?: CardId; onPick: () => void; onClear: () => void }) {
    const card = props.id === undefined ? undefined : getCard(props.id);
    return (
        <div className="fusion-slot" data-type={card?.cardType} data-filled={card !== undefined}>
            <button
                type="button"
                className="fusion-slot__pick"
                aria-label={card ? `${props.label}: ${card.name}. Change it` : `${props.label}: choose a card`}
                onClick={props.onPick}
            >
                <span className="fusion-slot__art" aria-hidden="true">
                    {card ? <CardImage id={card.id} size="thumb" /> : <PlusIcon />}
                </span>
                <span className="fusion-slot__text">
                    <span className="fusion-slot__label">{props.label}</span>
                    <span className="fusion-slot__name">{card ? card.name : "Choose a card"}</span>
                    {card?.cardType === "Monster" && (
                        <span className="card-row__stats">{`${card.attack} / ${card.defense}`}</span>
                    )}
                </span>
            </button>
            {card && (
                <button
                    type="button"
                    className="icon-button icon-button--small"
                    aria-label={`Clear ${props.label.toLowerCase()}`}
                    onClick={props.onClear}
                >
                    <CloseIcon />
                </button>
            )}
        </div>
    );
}

/**
 * The fusion tool (spec 10 F-8), a preview on sample data until the catalog has fusions (spec 04 Q-5). Three modes,
 * each in the URL: Combine (?a=&b=), Uses (?mode=with&of=) and Recipes (?mode=for&of=).
 */
export default function FusionPage() {
    const [params, setParams] = useUrlParams();
    const { open } = useCardParam();
    const [picking, setPicking] = useState<SlotName | null>(null);

    const modeParam = params.get("mode");
    const mode: Mode = modeParam === "with" || modeParam === "for" ? modeParam : "combine";
    const a = parseId(params.get("a"));
    const b = parseId(params.get("b"));
    const of = parseId(params.get("of"));

    useEffect(() => {
        document.title = `Fusion · ${SITE_TITLE}`;
    }, []);

    const result = a !== undefined && b !== undefined ? getFusion(a, b) : undefined;
    const fusions = of === undefined ? [] : mode === "with" ? getFusionsWith(of) : getFusionsFor(of);

    return (
        <section className="fusion-page" aria-labelledby="fusion-title">
            <PreviewBanner route="fusion" />
            <h1 id="fusion-title" className="page-title">
                Fusion
            </h1>
            <Tabs
                label="Fusion tool"
                idPrefix="fusion"
                tabs={MODES}
                selected={mode}
                onSelect={(next) => setParams({ mode: next === "combine" ? undefined : next })}
            />

            <div {...tabPanelProps("fusion", mode)} className="fusion-panel">
                {mode === "combine" ? (
                    <>
                        <p className="hint">
                            Pick two monsters to see what they fuse into. Their order does not matter.
                        </p>
                        <div className="fusion-combine">
                            <Slot
                                label="First material"
                                id={a}
                                onPick={() => setPicking("a")}
                                onClear={() => setParams({ a: undefined })}
                            />
                            <button
                                type="button"
                                className="icon-button fusion-combine__swap"
                                aria-label="Swap the materials"
                                disabled={a === undefined && b === undefined}
                                onClick={() => setParams({ a: b?.toString(), b: a?.toString() })}
                            >
                                <SwapIcon />
                            </button>
                            <Slot
                                label="Second material"
                                id={b}
                                onPick={() => setPicking("b")}
                                onClear={() => setParams({ b: undefined })}
                            />
                        </div>

                        <div className="fusion-result" aria-live="polite">
                            {a === undefined || b === undefined ? (
                                <button
                                    type="button"
                                    className="button button--ghost"
                                    onClick={() => {
                                        const [first, second] = sampleFusionPair();
                                        setParams({ a: String(first), b: String(second) });
                                    }}
                                >
                                    Try a sample pair
                                </button>
                            ) : result ? (
                                <>
                                    <h2 className="section-title">Fuses into</h2>
                                    <CardRow card={result} onOpen={open} />
                                </>
                            ) : (
                                <EmptyState title="No fusion">
                                    These two cards make nothing in the sample data. Try another pair.
                                </EmptyState>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="hint">
                            {mode === "with"
                                ? "Pick a monster to see everything it fuses with, strongest result first."
                                : "Pick a monster to see every pair that makes it."}
                        </p>
                        <Slot
                            label={mode === "with" ? "Card" : "Result"}
                            id={of}
                            onPick={() => setPicking("of")}
                            onClear={() => setParams({ of: undefined })}
                        />
                        {of !== undefined &&
                            (fusions.length === 0 ? (
                                <EmptyState title="No fusions">
                                    {mode === "with"
                                        ? "This card fuses with nothing in the sample data."
                                        : "No pair makes this card in the sample data."}
                                </EmptyState>
                            ) : (
                                <>
                                    <p className="summary" role="status">
                                        <strong>
                                            {fusions.length} {fusions.length === 1 ? "fusion" : "fusions"}
                                        </strong>
                                    </p>
                                    <ul className="fusion-list">
                                        {fusions.map(({ materials: [first, second], result: made }) => (
                                            <li key={`${first.id}+${second.id}`} className="fusion-item">
                                                <span className="fusion-item__materials">
                                                    <button
                                                        type="button"
                                                        className="card-ref"
                                                        onClick={() => open(first.id)}
                                                    >
                                                        {first.name}
                                                    </button>
                                                    {" + "}
                                                    <button
                                                        type="button"
                                                        className="card-ref"
                                                        onClick={() => open(second.id)}
                                                    >
                                                        {second.name}
                                                    </button>
                                                </span>
                                                <CardRow card={made} onOpen={open} />
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ))}
                    </>
                )}
            </div>

            <CardPicker
                open={picking !== null}
                title={picking ? PICKER_TITLES[picking] : ""}
                query={MONSTERS}
                onPick={(id) => picking && setParams({ [picking]: String(id) })}
                onClose={() => setPicking(null)}
            />
            <PageCardDetails />
        </section>
    );
}
