import { useEffect, useMemo, useState } from "react";
import { getCard, searchCards, type CardId, type CardSearchResult } from "@mhsalves/yugioh-fb-catalog";
import { catalogUrl } from "../catalogUrl";
import CardRow from "../components/CardRow";
import EmptyState from "../components/EmptyState";
import PageCardDetails from "../components/PageCardDetails";
import SearchBox from "../components/SearchBox";
import { getCardByPassword } from "../data/cards";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useCardParam, useUrlParams } from "../urlParams";

const LIMIT = 30;
const RECENT_KEY = "fm:recent";
const RECENT_MAX = 8;

interface Recent {
    searches: string[];
    cards: CardId[];
}

// Recent searches and cards live in this browser only, best effort: the page works the same without them.
function readRecent(): Recent {
    try {
        const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "null") as Partial<Recent> | null;
        return { searches: value?.searches ?? [], cards: value?.cards ?? [] };
    } catch {
        return { searches: [], cards: [] };
    }
}

function writeRecent(recent: Recent): void {
    try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
    } catch {
        // Storage blocked or full: nothing to remember.
    }
}

const addFirst = <T,>(list: T[], value: T) => [value, ...list.filter((item) => item !== value)].slice(0, RECENT_MAX);

type Lookup = { kind: "number" | "password" | "name"; result: CardSearchResult };

/** "425" or "#425" opens that card number, 8 digits look up a password, anything else searches names. */
function lookUp(text: string): Lookup {
    const number = text.match(/^#?(\d{1,3})$/)?.[1];
    if (number) return { kind: "number", result: searchCards({ ids: [Number(number)] }) };
    if (/^\d{8}$/.test(text)) {
        const card = getCardByPassword(text);
        return { kind: "password", result: { total: card ? 1 : 0, items: card ? [card] : [] } };
    }
    return { kind: "name", result: searchCards({ text, limit: LIMIT }) };
}

/**
 * Quick card search from any page (spec 10 F-7): text only, no filters (those stay on the Cards page). The query is
 * in the URL (?q=), and a picked card opens in the details panel here, so search keeps the player's place.
 */
export default function SearchPage() {
    const [params, setParams] = useUrlParams();
    const text = (params.get("q") ?? "").trim();
    const { open } = useCardParam();
    const [recent, setRecent] = useState(readRecent);
    const lookup = useMemo(() => (text ? lookUp(text) : undefined), [text]);

    useEffect(() => {
        document.title = text ? `${text} · Search · ${SITE_TITLE}` : `Search · ${SITE_TITLE}`;
    }, [text]);

    const remember = (next: Recent) => {
        setRecent(next);
        writeRecent(next);
    };
    const openCard = (id: CardId) => {
        remember({
            searches: text ? addFirst(recent.searches, text) : recent.searches,
            cards: addFirst(recent.cards, id),
        });
        open(id);
    };
    const recentCards = recent.cards.flatMap((id) => getCard(id) ?? []);

    return (
        <section className="search-page" aria-labelledby="search-title">
            <h1 id="search-title" className="page-title">
                Search
            </h1>
            <SearchBox
                id="search-input"
                value={params.get("q") ?? ""}
                onChange={(q) => setParams({ q: q || undefined })}
                label="Search cards"
                placeholder="Name, card number or password"
                autoFocus
            />

            {lookup === undefined ? (
                <div className="search-page__recent">
                    <p className="hint">Type a card name, a card number such as 425, or an 8-digit password.</p>
                    {recent.searches.length > 0 && (
                        <section aria-labelledby="recent-searches">
                            <h2 id="recent-searches" className="section-title">
                                Recent searches
                            </h2>
                            <div className="chips">
                                {recent.searches.map((search) => (
                                    <button
                                        key={search}
                                        type="button"
                                        className="chip"
                                        onClick={() => setParams({ q: search })}
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                    {recentCards.length > 0 && (
                        <section aria-labelledby="recent-cards">
                            <h2 id="recent-cards" className="section-title">
                                Recently opened
                            </h2>
                            <ul className="card-rows">
                                {recentCards.map((card) => (
                                    <li key={card.id}>
                                        <CardRow card={card} onOpen={openCard} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {(recent.searches.length > 0 || recentCards.length > 0) && (
                        <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => remember({ searches: [], cards: [] })}
                        >
                            Clear history
                        </button>
                    )}
                </div>
            ) : lookup.result.total === 0 ? (
                <EmptyState title="No cards found">
                    {lookup.kind === "password"
                        ? `No card has the password ${text}.`
                        : lookup.kind === "number"
                          ? `Card #${text.replace("#", "")} is not in the catalog.`
                          : "Try another name, a card number such as 425, or an 8-digit password."}
                </EmptyState>
            ) : (
                <>
                    <p className="summary" role="status">
                        <strong>
                            {lookup.result.total} {lookup.result.total === 1 ? "card" : "cards"}
                        </strong>
                        {lookup.result.total > lookup.result.items.length &&
                            ` · showing the first ${lookup.result.items.length}`}
                    </p>
                    <ul className="card-rows">
                        {lookup.result.items.map((card) => (
                            <li key={card.id}>
                                <CardRow card={card} onOpen={openCard} />
                            </li>
                        ))}
                    </ul>
                    {lookup.kind === "name" && (
                        <Link to={catalogUrl({ query: { text } })} className="button button--ghost search-page__all">
                            Filter these {lookup.result.total} in the catalog
                        </Link>
                    )}
                </>
            )}

            <PageCardDetails />
        </section>
    );
}
