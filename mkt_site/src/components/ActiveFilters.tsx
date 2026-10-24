import type { CardQuery } from "@mhsalves/yugioh-fb-catalog";
import { activeFilters } from "../catalogUrl";
import { CloseIcon } from "./icons";

/**
 * The filter-panel fields that are set, as removable chips above the results, so on phones the filters sheet need
 * not be opened to see or undo them. Renders nothing when no panel filter is set.
 */
export default function ActiveFilters({ query, onChange }: { query: CardQuery; onChange: (query: CardQuery) => void }) {
    const filters = activeFilters(query);
    if (filters.length === 0) return null;

    return (
        <div className="active-filters">
            <ul className="active-filters__list" aria-label="Active filters">
                {filters.map((filter) => (
                    <li key={filter.id}>
                        <button
                            type="button"
                            className="chip chip--removable"
                            aria-label={`Remove filter: ${filter.label}`}
                            onClick={() => onChange(filter.without)}
                        >
                            {filter.label}
                            <CloseIcon />
                        </button>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                className="text-button"
                onClick={() => onChange({ text: query.text, cardType: query.cardType, sort: query.sort })}
            >
                Clear all
            </button>
        </div>
    );
}
