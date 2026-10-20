import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A minimal history router: paths are app-relative ("/?q=dragon") and the base path is added only at the URL boundary.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAVIGATE_EVENT = "app:navigate";

function currentPath(): string {
    const { pathname } = window.location;
    const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
    return path.replace(/\/+$/, "") || "/";
}

function currentSearch(): string {
    return window.location.search;
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener("popstate", onChange);
    window.addEventListener(NAVIGATE_EVENT, onChange);
    return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(NAVIGATE_EVENT, onChange);
    };
}

export function usePath(): string {
    return useSyncExternalStore(subscribe, currentPath);
}

/** The query string, including the leading "?" (or "" when empty). */
export function useSearch(): string {
    return useSyncExternalStore(subscribe, currentSearch);
}

/** A card's own page, the address the Share button hands out (spec 09 C-7). */
export function cardPath(id: number): string {
    return `/cards/${id}/`;
}

export function href(path: string): string {
    return `${BASE}${path}`;
}

interface NavigateOptions {
    /** Replace the current history entry instead of adding one. */
    replace?: boolean;
    /** Stored with the history entry (read back with `window.history.state`). */
    state?: unknown;
}

export function navigate(path: string, { replace = false, state = null }: NavigateOptions = {}): void {
    if (replace) window.history.replaceState(state, "", href(path));
    else window.history.pushState(state, "", href(path));
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        // Let the browser handle new-tab clicks and anything already handled.
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        const here = window.location.pathname + window.location.search === href(to);
        navigate(to, { replace: here });
        window.scrollTo(0, 0);
    };

    return <a href={href(to)} onClick={handleClick} {...rest} />;
}
