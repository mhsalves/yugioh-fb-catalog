import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CARD_TYPES,
    getCard,
    getCardList,
    searchCards,
    TOTAL_CARDS,
    type CardId,
    type CardQuery,
    type TCardType,
} from "@mhsalves/yugioh-fb-catalog";
import {
    catalogUrl,
    countFilters,
    monstersSelected,
    parseCatalogUrl,
    SORT_KEYS,
    withoutMonsterFilters,
} from "../catalogUrl";
import ActiveFilters from "../components/ActiveFilters";
import CardDetails from "../components/CardDetails";
import CardTile from "../components/CardTile";
import EmptyState from "../components/EmptyState";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import SearchBox from "../components/SearchBox";
import { FilterIcon, SortIcon } from "../components/icons";
import { getCardByPassword } from "../data/cards";
import { CATALOG_SEARCH_ID } from "../keyboard";
import { navigate, useSearch } from "../router";

const SORT_LABELS = { id: "ID", name: "Name", attack: "ATK", defense: "DEF", level: "Level", cost: "Cost" };
const SITE_TITLE = "Yu-Gi-Oh! FM Catalog";
/** Cards per results page (owner choice): full rows at 2, 3 and 6 columns; at 4 the last row has 2. */
const PAGE_SIZE = 30;

/**
 * The search box also takes a card number ("#425") or an 8-digit password (spec 10 F-7, folded into this page). They
 * become an `ids` query; everything else is a name search (spec 09 C-2). The URL keeps what was typed.
 */
function toSearchQuery(query: CardQuery): CardQuery {
    const text = query.text?.trim() ?? "";
    const number = text.match(/^#(\d{1,3})$/)?.[1];
    if (number) return { ...query, text: undefined, ids: [Number(number)] };
    if (/^\d{8}$/.test(text)) {
        // No card has id 0: an unknown password matches nothing (an empty `ids` would match everything).
        return { ...query, text: undefined, ids: [getCardByPassword(text)?.id ?? 0] };
    }
    return query;
}

/** "By type" quick filter (spec 09 C-2): maps to CardQuery.cardType; no selection = all types. */
function TypeFilter({ selected, onChange }: { selected: TCardType[]; onChange: (cardType: TCardType[]) => void }) {
    const toggle = (type: TCardType) =>
        onChange(selected.includes(type) ? selected.filter((item) => item !== type) : [...selected, type]);

    return (
        <fieldset className="type-filter">
            <legend className="visually-hidden">By type</legend>
            <span className="type-filter__label" aria-hidden="true">
                By type
            </span>
            <div className="chips">
                <button
                    type="button"
                    className="chip"
                    aria-pressed={selected.length === 0}
                    onClick={() => onChange([])}
                >
                    All types
                </button>
                {CARD_TYPES.map((type) => (
                    <button
                        key={type}
                        type="button"
                        className="chip"
                        data-type={type}
                        aria-pressed={selected.includes(type)}
                        onClick={() => toggle(type)}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

/** The single page of the site (spec 09): a filter over searchCards, a results grid and the details panel. */
export default function CatalogPage() {
    const search = useSearch();
    const { query, cardId, page: pageParam } = useMemo(() => parseCatalogUrl(search), [search]);
    const searchQuery = useMemo(() => toSearchQuery(query), [query]);
    // Every match, for the count and for previous / next in the details panel (which crosses page edges)...
    const result = useMemo(() => searchCards(searchQuery), [searchQuery]);
    const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    const page = Math.min(pageParam ?? 1, pageCount);
    // ...and the page the grid shows, through the library's own limit and offset (spec 04 Q-4).
    const pageItems = useMemo(
        () => searchCards({ ...searchQuery, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).items,
        [searchQuery, page],
    );
    const [filtersOpen, setFiltersOpen] = useState(false);
    const resultsRef = useRef<HTMLElement>(null);

    // Filter changes replace the history entry and go back to the first page; opening a card adds an entry, so Back
    // closes it (C-6). With the panel already open, picking another card swaps it in place, so Back still closes the
    // panel in one step. Page changes add an entry, so Back returns to the previous page.
    const setQuery = useCallback(
        (next: CardQuery) => navigate(catalogUrl({ query: next, cardId }), { replace: true }),
        [cardId],
    );
    const setText = useCallback((text: string) => setQuery({ ...query, text: text || undefined }), [query, setQuery]);
    const openCard = useCallback(
        (id: CardId) =>
            cardId === undefined
                ? navigate(catalogUrl({ query, page, cardId: id }), { state: { card: true } })
                : navigate(catalogUrl({ query, page, cardId: id }), { replace: true, state: window.history.state }),
        [query, page, cardId],
    );
    // Previous / next in the panel: the grid follows to the card's page, so its tile stays highlighted.
    const selectCard = useCallback(
        (id: CardId) => {
            const index = result.items.findIndex((card) => card.id === id);
            const cardPage = index < 0 ? page : Math.floor(index / PAGE_SIZE) + 1;
            navigate(catalogUrl({ query, page: cardPage, cardId: id }), {
                replace: true,
                state: window.history.state,
            });
        },
        [query, page, result],
    );
    const closeCard = useCallback(() => {
        if ((window.history.state as { card?: boolean } | null)?.card) window.history.back();
        else navigate(catalogUrl({ query, page }), { replace: true });
    }, [query, page]);
    const goToPage = useCallback(
        (next: number) => {
            navigate(catalogUrl({ query, page: next, cardId }));
            window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
        },
        [query, cardId],
    );
    const closeFilters = useCallback(() => setFiltersOpen(false), []);

    const index = cardId === undefined ? -1 : result.items.findIndex((card) => card.id === cardId);
    const prevId = index > 0 ? result.items[index - 1].id : undefined;
    const nextId = index >= 0 && index < result.items.length - 1 ? result.items[index + 1].id : undefined;
    const first = (page - 1) * PAGE_SIZE + 1;

    useEffect(() => {
        const name = cardId === undefined ? undefined : (getCard(cardId)?.name ?? `Card #${cardId}`);
        document.title = name ? `${name} · ${SITE_TITLE}` : SITE_TITLE;
    }, [cardId]);

    const sortBy = query.sort?.by ?? "id";
    const descending = query.sort?.dir === "desc";
    const filterCount = countFilters(query);

    return (
        <div className="catalog" data-panel={cardId !== undefined}>
            <Filters query={query} onChange={setQuery} total={result.total} open={filtersOpen} onClose={closeFilters} />

            <section className="results" aria-labelledby="results-title" ref={resultsRef}>
                <h1 id="results-title" className="visually-hidden">
                    Card catalog
                </h1>
                <div className="toolbar">
                    {/* Search text is debounced before it reaches the URL; everything else updates at once. */}
                    <SearchBox
                        id={CATALOG_SEARCH_ID}
                        value={query.text ?? ""}
                        onChange={setText}
                        label="Search cards by name, #number or password"
                        placeholder="Name, #number or password"
                    />
                    <button
                        type="button"
                        className="button button--ghost toolbar__filters"
                        aria-controls="catalog-filters"
                        aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen(true)}
                    >
                        <FilterIcon /> Filters
                        {filterCount > 0 && (
                            <span className="badge">
                                {filterCount}
                                <span className="visually-hidden"> set</span>
                            </span>
                        )}
                    </button>
                </div>

                <TypeFilter
                    selected={query.cardType === undefined ? [] : ([] as TCardType[]).concat(query.cardType)}
                    onChange={(cardType) => {
                        const next = { ...query, cardType: cardType.length ? cardType : undefined };
                        // Deselecting "Monster" turns its filters off, so they no longer narrow the results.
                        setQuery(monstersSelected(next) ? next : withoutMonsterFilters(next));
                    }}
                />

                <ActiveFilters query={query} onChange={setQuery} />

                <div className="toolbar toolbar--secondary">
                    <p className="summary" role="status">
                        <strong>
                            {result.total} {result.total === 1 ? "card" : "cards"}
                        </strong>{" "}
                        {pageCount > 1
                            ? `· ${first}–${first + pageItems.length - 1} shown`
                            : `· ${getCardList().length} of ${TOTAL_CARDS} catalogued`}
                    </p>
                    <div className="sort">
                        <label htmlFor="sort-by">Sort</label>
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(event) =>
                                setQuery({
                                    ...query,
                                    sort: { by: event.target.value as typeof sortBy, dir: query.sort?.dir },
                                })
                            }
                        >
                            {SORT_KEYS.map((key) => (
                                <option key={key} value={key}>
                                    {SORT_LABELS[key]}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="icon-button icon-button--small"
                            aria-label={
                                descending
                                    ? "Sorted descending, switch to ascending"
                                    : "Sorted ascending, switch to descending"
                            }
                            onClick={() =>
                                setQuery({ ...query, sort: { by: sortBy, dir: descending ? "asc" : "desc" } })
                            }
                        >
                            <SortIcon descending={descending} />
                        </button>
                    </div>
                </div>

                {result.total === 0 ? (
                    <EmptyState
                        title="No cards found"
                        action={
                            <button type="button" className="button" onClick={() => setQuery({ sort: query.sort })}>
                                Clear filters
                            </button>
                        }
                    >
                        No cards match these filters. Try another type or clear the filters.
                    </EmptyState>
                ) : (
                    <>
                        <ul className="grid">
                            {pageItems.map((card) => (
                                <li key={card.id}>
                                    <CardTile card={card} onOpen={openCard} selected={card.id === cardId} />
                                </li>
                            ))}
                        </ul>
                        <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
                    </>
                )}
            </section>

            <CardDetails cardId={cardId} prevId={prevId} nextId={nextId} onSelect={selectCard} onClose={closeCard} />
        </div>
    );
}
