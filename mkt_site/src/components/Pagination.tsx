import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/** Page numbers to show: the first, the last and the current one with its neighbours; "gap" stands for the rest. */
function pageItems(page: number, count: number): (number | "gap")[] {
    const pages = [...new Set([1, page - 1, page, page + 1, count])].filter((item) => item >= 1 && item <= count);
    pages.sort((a, b) => a - b);
    return pages.flatMap((item, index) => (index > 0 && item - pages[index - 1] > 1 ? ["gap" as const, item] : [item]));
}

/**
 * Results pages (spec 09 C-3): Previous / "Page 2 of 15" / Next on phones, numbered pages from md up. Renders
 * nothing for a single page.
 */
export default function Pagination(props: { page: number; pageCount: number; onChange: (page: number) => void }) {
    const { page, pageCount, onChange } = props;
    if (pageCount <= 1) return null;

    return (
        <nav className="pagination" aria-label="Results pages">
            <button
                type="button"
                className="button button--ghost pagination__step"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
            >
                <ChevronLeftIcon />
                Previous
            </button>

            <p className="pagination__status" aria-live="polite">
                Page <strong>{page}</strong> of {pageCount}
            </p>

            <ol className="pagination__pages">
                {pageItems(page, pageCount).map((item, index) =>
                    item === "gap" ? (
                        <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
                            …
                        </li>
                    ) : (
                        <li key={item}>
                            <button
                                type="button"
                                className="pagination__page"
                                aria-label={`Page ${item}`}
                                aria-current={item === page ? "page" : undefined}
                                onClick={() => onChange(item)}
                            >
                                {item}
                            </button>
                        </li>
                    ),
                )}
            </ol>

            <button
                type="button"
                className="button button--ghost pagination__step"
                disabled={page >= pageCount}
                onClick={() => onChange(page + 1)}
            >
                Next
                <ChevronRightIcon />
            </button>
        </nav>
    );
}
