import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A minimal history router: paths are app-relative ("/cards/1") and the base path is added only at the URL boundary.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const NAVIGATE_EVENT = "app:navigate";

function currentPath(): string {
    const { pathname } = window.location;
    const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
    return path.replace(/\/+$/, "") || "/";
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

export function href(path: string): string {
    return `${BASE}${path}`;
}

export function navigate(path: string): void {
    window.history.pushState(null, "", href(path));
    window.dispatchEvent(new Event(NAVIGATE_EVENT));
    window.scrollTo(0, 0);
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
    const active = usePath() === to;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        // Let the browser handle new-tab clicks and anything already handled.
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        if (!active) navigate(to);
    };

    return <a href={href(to)} aria-current={active ? "page" : undefined} onClick={handleClick} {...rest} />;
}
