import { useEffect, useMemo } from "react";
import DuelistPortrait from "../components/DuelistPortrait";
import EmptyState from "../components/EmptyState";
import { ChevronRightIcon } from "../components/icons";
import PreviewBanner from "../components/PreviewBanner";
import SearchBox from "../components/SearchBox";
import { getDeckOf, getDropsFrom, getDuelistList, type DuelistView } from "../data/duelists";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useUrlParams } from "../urlParams";

function groupByStage(duelists: DuelistView[]): [string, DuelistView[]][] {
    const groups = new Map<string, DuelistView[]>();
    for (const duelist of duelists) groups.set(duelist.stage, [...(groups.get(duelist.stage) ?? []), duelist]);
    return [...groups];
}

/** The duelist list (spec 10 F-9), a preview on sample data until the catalog has duelists (spec 02 TBD-D9). */
export default function DuelistsPage() {
    const [params, setParams] = useUrlParams();
    const text = params.get("q") ?? "";
    const groups = useMemo(() => groupByStage(getDuelistList({ text })), [text]);

    useEffect(() => {
        document.title = `Duelists · ${SITE_TITLE}`;
    }, []);

    return (
        <section className="duelists-page" aria-labelledby="duelists-title">
            <PreviewBanner route="duelists" />
            <h1 id="duelists-title" className="page-title">
                Duelists
            </h1>
            <SearchBox value={text} onChange={(q) => setParams({ q: q || undefined })} label="Search duelists" />

            {groups.length === 0 ? (
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
                groups.map(([stage, duelists]) => (
                    <section key={stage} className="duelist-group" aria-label={stage}>
                        <h2 className="section-title">{stage}</h2>
                        <ul className="duelist-list">
                            {duelists.map((duelist) => (
                                <li key={duelist.id}>
                                    <Link to={`/duelists/${duelist.id}`} className="duelist-row">
                                        <DuelistPortrait name={duelist.name} />
                                        <span className="duelist-row__main">
                                            <span className="duelist-row__name">{duelist.name}</span>
                                            <span className="duelist-row__meta">
                                                {getDropsFrom(duelist.id).length} drops · {getDeckOf(duelist.id).length}{" "}
                                                deck cards
                                            </span>
                                        </span>
                                        <ChevronRightIcon />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))
            )}
        </section>
    );
}
