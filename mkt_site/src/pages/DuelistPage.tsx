import { useEffect, type CSSProperties } from "react";
import CardRow from "../components/CardRow";
import DuelistPortrait from "../components/DuelistPortrait";
import EmptyState from "../components/EmptyState";
import { ChevronLeftIcon, ChevronRightIcon } from "../components/icons";
import PageCardDetails from "../components/PageCardDetails";
import PercentBar from "../components/PercentBar";
import Tabs, { tabPanelProps } from "../components/Tabs";
import {
    DROP_RANKS,
    getDeckOf,
    getDropsFrom,
    getDuelist,
    getDuelistList,
    type DeckEntryView,
    type DropRank,
    type DuelistView,
    type RateSort,
} from "../data/duelists";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useCardParam, useUrlParams } from "../urlParams";
import { useCountUp } from "../useCountUp";
import type { CardId } from "@mhsalves/yugioh-fm-catalog";

type Tab = "drops" | "deck";

const TABS = [
    { id: "drops", label: "Drops" },
    { id: "deck", label: "Deck" },
] as const satisfies readonly { id: Tab; label: string }[];

/** When the game uses each drop pool. */
const RANK_HINTS: Record<DropRank, string> = {
    "S/A-POW": "S or A rank, POW win",
    "B/C/D": "B, C or D rank",
    "S/A-TEC": "S or A rank, TEC win",
};

/** A stat tile whose number counts up when the page opens. */
function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="duelist-stat">
            <dt>{label}</dt>
            <dd>{useCountUp(value)}</dd>
        </div>
    );
}

/** Cards with their rates. Rows come in one after another and their bars grow; a new `key` plays it again. */
function RateList({ rows, onOpen }: { rows: DeckEntryView[]; onOpen: (id: CardId) => void }) {
    const top = Math.max(0, ...rows.map((row) => row.rate));
    return (
        <ul className="card-rows">
            {rows.map((row, index) => (
                <li key={row.card.id} className="rate-row" style={{ "--i": index } as CSSProperties}>
                    <CardRow card={row.card} onOpen={onOpen}>
                        <PercentBar value={row.rate} max={top} />
                    </CardRow>
                </li>
            ))}
        </ul>
    );
}

/** Previous or next duelist in the game's order. */
function NeighborLink({ duelist, direction }: { duelist: DuelistView | undefined; direction: "prev" | "next" }) {
    if (!duelist) return <span className="duelist-neighbor duelist-neighbor--empty" />;
    return (
        <Link
            to={`/duelists/${duelist.id}`}
            className={`duelist-neighbor duelist-neighbor--${direction}`}
            aria-label={`${direction === "prev" ? "Previous" : "Next"} duelist: ${duelist.name}`}
        >
            {direction === "prev" && <ChevronLeftIcon />}
            <DuelistPortrait name={duelist.name} portrait={duelist.portrait} />
            <span className="duelist-neighbor__text">
                <span className="duelist-neighbor__label">{direction === "prev" ? "Previous" : "Next"}</span>
                <span className="duelist-neighbor__name">{duelist.name}</span>
            </span>
            {direction === "next" && <ChevronRightIcon />}
        </Link>
    );
}

/**
 * One duelist (spec 10 F-9): the cards they drop, by rank, and the cards their deck is drawn from, with the game's
 * rates. Phones show one rank at a time; from lg up the three ranks sit side by side and the page uses the full
 * window. Tab, rank and sort are in the URL.
 */
export default function DuelistPage({ id }: { id: string }) {
    const duelist = getDuelist(id);
    const [params, setParams] = useUrlParams();
    const { cardId, open } = useCardParam();

    const tab: Tab = params.get("tab") === "deck" ? "deck" : "drops";
    const rankParam = params.get("rank");
    const rank: DropRank = DROP_RANKS.find((item) => item === rankParam) ?? DROP_RANKS[0];
    const sort: RateSort = params.get("sort") === "attack" ? "attack" : "rate";

    useEffect(() => {
        document.title = `${duelist?.name ?? "Duelist not found"} · Duelists · ${SITE_TITLE}`;
    }, [duelist]);

    const back = (
        <Link to="/duelists" className="back-link">
            <ChevronLeftIcon /> All duelists
        </Link>
    );

    if (!duelist) {
        return (
            <section className="duelist-page">
                {back}
                <EmptyState title="Duelist not found">There is no duelist “{id}”.</EmptyState>
            </section>
        );
    }

    const all = getDuelistList();
    const index = all.findIndex((item) => item.id === duelist.id);
    const drops = DROP_RANKS.map((item) => [item, getDropsFrom(duelist.id, { rank: item, sort })] as const);
    const deck = getDeckOf(duelist.id, { sort });

    return (
        <section className="duelist-page" aria-labelledby="duelist-title" data-panel={cardId !== undefined}>
            {back}

            {/* Keyed by duelist: going to the next one plays the entrance again. */}
            <header className="duelist-hero" key={duelist.id}>
                {duelist.portrait && (
                    <div
                        className="duelist-hero__backdrop"
                        style={{ backgroundImage: `url("${duelist.portrait.url}")` }}
                        aria-hidden="true"
                    />
                )}
                <DuelistPortrait name={duelist.name} portrait={duelist.portrait} large />
                <div className="duelist-hero__info">
                    <p className="duelist-hero__eyebrow">
                        Free Duel #{duelist.number} of {all.length}
                    </p>
                    <h1 id="duelist-title" className="duelist-hero__name">
                        {duelist.name}
                    </h1>
                    {duelist.portrait && (
                        <p className="duelist-credit">
                            Portrait:{" "}
                            <a href={duelist.portrait.source.pageUrl} target="_blank" rel="noopener noreferrer">
                                {duelist.portrait.source.name}
                            </a>
                        </p>
                    )}
                    <dl className="duelist-stats">
                        <Stat label="Deck pool" value={deck.length} />
                        {drops.map(([item, rows]) => (
                            <Stat key={item} label={`${item} drops`} value={rows.length} />
                        ))}
                    </dl>
                </div>
                <nav className="duelist-hero__nav" aria-label="Other duelists">
                    <NeighborLink duelist={all[index - 1]} direction="prev" />
                    <NeighborLink duelist={all[index + 1]} direction="next" />
                </nav>
            </header>

            <div className="duelist-controls">
                <Tabs
                    label={`${duelist.name}'s cards`}
                    idPrefix="duelist"
                    tabs={TABS}
                    selected={tab}
                    onSelect={(next) => setParams({ tab: next === "drops" ? undefined : next })}
                />
                {tab === "drops" && (
                    <div className="chips duelist-rank-chips" role="group" aria-label="Drop rank">
                        {DROP_RANKS.map((item) => (
                            <button
                                key={item}
                                type="button"
                                className="chip"
                                aria-pressed={item === rank}
                                onClick={() => setParams({ rank: item === DROP_RANKS[0] ? undefined : item })}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                )}
                <div className="sort">
                    <label htmlFor="duelist-sort">Sort</label>
                    <select
                        id="duelist-sort"
                        value={sort}
                        onChange={(event) =>
                            setParams({ sort: event.target.value === "attack" ? "attack" : undefined })
                        }
                    >
                        <option value="rate">Rate</option>
                        <option value="attack">ATK</option>
                    </select>
                </div>
            </div>

            <div {...tabPanelProps("duelist", tab)} className="duelist-panel" key={tab}>
                {tab === "drops" ? (
                    <div className="rank-columns">
                        {drops.map(([item, rows]) => (
                            <section
                                key={item}
                                className="rank-column"
                                data-active={item === rank || undefined}
                                aria-label={`${item} drops`}
                            >
                                <header className="rank-column__head">
                                    <h2 className="rank-column__title">{item}</h2>
                                    <span className="rank-column__hint">{RANK_HINTS[item]}</span>
                                    <span className="rank-column__count">
                                        {rows.length} {rows.length === 1 ? "card" : "cards"}
                                    </span>
                                </header>
                                <RateList key={`${item}-${sort}`} rows={rows} onOpen={open} />
                            </section>
                        ))}
                    </div>
                ) : (
                    <section className="rank-column rank-column--deck" data-active aria-label="Deck pool">
                        <header className="rank-column__head">
                            <h2 className="rank-column__title">Deck pool</h2>
                            <span className="rank-column__hint">The deck is rolled from these before each duel</span>
                            <span className="rank-column__count">
                                {deck.length} {deck.length === 1 ? "card" : "cards"}
                            </span>
                        </header>
                        <RateList key={`deck-${sort}`} rows={deck} onOpen={open} />
                    </section>
                )}
            </div>

            <PageCardDetails />
        </section>
    );
}
