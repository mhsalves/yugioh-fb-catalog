import { useEffect, useMemo, type CSSProperties } from "react";
import DuelistPortrait from "../components/DuelistPortrait";
import EmptyState from "../components/EmptyState";
import { ChevronRightIcon } from "../components/icons";
import SearchBox from "../components/SearchBox";
import { getDeckOf, getDropsFrom, getDuelistList } from "../data/duelists";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useUrlParams } from "../urlParams";

/** The duelist list (spec 10 F-9): every Free Duel opponent, in the game's order. */
export default function DuelistsPage() {
    const [params, setParams] = useUrlParams();
    const text = params.get("q") ?? "";
    const duelists = useMemo(() => getDuelistList({ text }), [text]);

    useEffect(() => {
        document.title = `Duelists · ${SITE_TITLE}`;
    }, []);

    return (
        <section className="duelists-page" aria-labelledby="duelists-title">
            <h1 id="duelists-title" className="page-title">
                Duelists
            </h1>
            <SearchBox value={text} onChange={(q) => setParams({ q: q || undefined })} label="Search duelists" />

            {duelists.length === 0 ? (
                <EmptyState
                    title="No duelists found"
                    action={
                        <button type="button" className="button" onClick={() => setParams({ q: undefined })}>
                            Show all duelists
                        </button>
                    }
                >
                    No duelist has that name.
                </EmptyState>
            ) : (
                <ul className="duelist-list">
                    {duelists.map((duelist, index) => (
                        <li key={duelist.id} style={{ "--i": index } as CSSProperties}>
                            <Link to={`/duelists/${duelist.id}`} className="duelist-row">
                                <DuelistPortrait name={duelist.name} portrait={duelist.portrait} />
                                <span className="duelist-row__main">
                                    <span className="duelist-row__name">{duelist.name}</span>
                                    <span className="duelist-row__meta">
                                        #{duelist.number} · {getDropsFrom(duelist.id).length} drops ·{" "}
                                        {getDeckOf(duelist.id).length} deck cards
                                    </span>
                                </span>
                                <ChevronRightIcon />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
