import { useCallback, useEffect, useMemo, useState } from "react";
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
import CardDetails from "../components/CardDetails";
import CardTile from "../components/CardTile";
import EmptyState from "../components/EmptyState";
import Filters from "../components/Filters";
import SearchBox from "../components/SearchBox";
import { FilterIcon, SortIcon } from "../components/icons";
import { navigate, useSearch } from "../router";

const SORT_LABELS = { id: "ID", name: "Name", attack: "ATK", defense: "DEF", level: "Level", cost: "Cost" };
const SITE_TITLE = "Yu-Gi-Oh! FM Catalog";

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
    const { query, cardId } = useMemo(() => parseCatalogUrl(search), [search]);
    const result = useMemo(() => searchCards(query), [query]);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Filter changes replace the history entry; opening a card adds one, so Back closes it (C-6). With the panel
    // already open, picking another card swaps it in place, so Back still closes the panel in one step.
    const setQuery = useCallback(
        (next: CardQuery) => navigate(catalogUrl({ query: next, cardId }), { replace: true }),
        [cardId],
    );
    const setText = useCallback((text: string) => setQuery({ ...query, text: text || undefined }), [query, setQuery]);
    const openCard = useCallback(
        (id: CardId) =>
            cardId === undefined
                ? navigate(catalogUrl({ query, cardId: id }), { state: { card: true } })
                : navigate(catalogUrl({ query, cardId: id }), { replace: true, state: window.history.state }),
        [query, cardId],
    );
    const selectCard = useCallback(
        (id: CardId) => navigate(catalogUrl({ query, cardId: id }), { replace: true, state: window.history.state }),
        [query],
    );
    const closeCard = useCallback(() => {
        if ((window.history.state as { card?: boolean } | null)?.card) window.history.back();
        else navigate(catalogUrl({ query }), { replace: true });
    }, [query]);
    const closeFilters = useCallback(() => setFiltersOpen(false), []);

    const index = cardId === undefined ? -1 : result.items.findIndex((card) => card.id === cardId);
    const prevId = index > 0 ? result.items[index - 1].id : undefined;
    const nextId = index >= 0 && index < result.items.length - 1 ? result.items[index + 1].id : undefined;

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

            <section className="results" aria-labelledby="results-title">
                <h1 id="results-title" className="visually-hidden">
                    Card catalog
                </h1>
                <div className="toolbar">
                    {/* Search text is debounced before it reaches the URL; everything else updates at once. */}
                    <SearchBox value={query.text ?? ""} onChange={setText} label="Search cards by name" />
                    <button
                        type="button"
                        className="button button--ghost toolbar__filters"
                        aria-controls="catalog-filters"
                        aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen(true)}
                    >
                        <FilterIcon /> Filters{filterCount > 0 && ` (${filterCount})`}
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

                <div className="toolbar toolbar--secondary">
                    <p className="summary" role="status">
                        <strong>
                            {result.total} {result.total === 1 ? "card" : "cards"}
                        </strong>{" "}
                        · {getCardList().length} of {TOTAL_CARDS} catalogued
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
                    <ul className="grid">
                        {result.items.map((card) => (
                            <li key={card.id}>
                                <CardTile card={card} onOpen={openCard} selected={card.id === cardId} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <CardDetails cardId={cardId} prevId={prevId} nextId={nextId} onSelect={selectCard} onClose={closeCard} />
        </div>
    );
}
