import { useCallback, useMemo } from "react";
import type { CardId } from "@mhsalves/yugioh-fm-catalog";
import { navigate, usePath, useSearch } from "./router";

// A page's state in the query string (spec 10 F-4), the pattern catalogUrl.ts uses for the catalog.

type Patch = Record<string, string | undefined>;

/** The current path with some query parameters changed; `undefined` removes one. */
function withParams(path: string, patch: Patch): string {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
    }
    const search = params.toString().replace(/%2C/g, ",");
    return search ? `${path}?${search}` : path;
}

/** The query string as URLSearchParams, and a setter that replaces the history entry (no history spam). */
export function useUrlParams(): [URLSearchParams, (patch: Patch) => void] {
    const path = usePath();
    const search = useSearch();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const set = useCallback(
        (patch: Patch) => navigate(withParams(path, patch), { replace: true, state: window.history.state }),
        [path],
    );
    return [params, set];
}

/**
 * `?card=<id>` on any page (spec 10 F-5), for the card details panel. Opening a card adds a history entry, so Back
 * closes it; picking another card while it is open swaps it in place (spec 09 C-6).
 */
export function useCardParam() {
    const path = usePath();
    const search = useSearch();
    const cardId = useMemo(() => {
        const raw = new URLSearchParams(search).get("card");
        const id = raw === null ? NaN : Number(raw);
        return Number.isInteger(id) && id > 0 ? id : undefined;
    }, [search]);

    const open = useCallback(
        (id: CardId) =>
            cardId === undefined
                ? navigate(withParams(path, { card: String(id) }), { state: { ...window.history.state, card: true } })
                : navigate(withParams(path, { card: String(id) }), { replace: true, state: window.history.state }),
        [path, cardId],
    );
    const close = useCallback(() => {
        if ((window.history.state as { card?: boolean } | null)?.card) window.history.back();
        else navigate(withParams(path, { card: undefined }), { replace: true });
    }, [path]);

    return { cardId, open, close };
}
