import { useEffect } from "react";
import CardRow from "../components/CardRow";
import DuelistPortrait from "../components/DuelistPortrait";
import EmptyState from "../components/EmptyState";
import { ChevronLeftIcon } from "../components/icons";
import PageCardDetails from "../components/PageCardDetails";
import PercentBar from "../components/PercentBar";
import PreviewBanner from "../components/PreviewBanner";
import Tabs, { tabPanelProps } from "../components/Tabs";
import { DROP_RANKS, getDeckOf, getDropsFrom, getDuelist, type DropRank, type RateSort } from "../data/duelists";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useCardParam, useUrlParams } from "../urlParams";

type Tab = "drops" | "deck";

const TABS = [
    { id: "drops", label: "Drops" },
    { id: "deck", label: "Deck" },
] as const satisfies readonly { id: Tab; label: string }[];

/**
 * One duelist (spec 10 F-9): the cards they drop, by rank, and the cards their deck is drawn from. A preview on
 * sample data until the catalog has duelists (spec 02 TBD-D9). Tab, rank and sort are in the URL.
 */
export default function DuelistPage({ id }: { id: string }) {
    const duelist = getDuelist(id);
    const [params, setParams] = useUrlParams();
    const { open } = useCardParam();

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

    const rows = tab === "drops" ? getDropsFrom(duelist.id, { rank, sort }) : getDeckOf(duelist.id, { sort });
    const top = Math.max(...rows.map((row) => row.rate));

    return (
        <section className="duelist-page" aria-labelledby="duelist-title">
            <PreviewBanner route="duelists" />
            {back}
            <header className="duelist-head">
                <DuelistPortrait name={duelist.name} large />
                <div>
                    <h1 id="duelist-title" className="page-title">
                        {duelist.name}
                    </h1>
                    <p className="hint">{duelist.stage}</p>
                </div>
            </header>

            <Tabs
                label={`${duelist.name}'s cards`}
                idPrefix="duelist"
                tabs={TABS}
                selected={tab}
                onSelect={(next) => setParams({ tab: next === "drops" ? undefined : next })}
            />

            <div {...tabPanelProps("duelist", tab)} className="duelist-panel">
                <div className="toolbar toolbar--secondary">
                    {tab === "drops" ? (
                        <div className="chips" role="group" aria-label="Drop rank">
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
                    ) : (
                        <p className="summary">How often each card is in the deck.</p>
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

                <p className="summary" role="status">
                    <strong>
                        {rows.length} {rows.length === 1 ? "card" : "cards"}
                    </strong>
                </p>
                <ul className="card-rows">
                    {rows.map((row) => (
                        <li key={row.card.id}>
                            <CardRow card={row.card} onOpen={open}>
                                <PercentBar value={row.rate} max={top} />
                            </CardRow>
                        </li>
                    ))}
                </ul>
            </div>

            <PageCardDetails />
        </section>
    );
}
