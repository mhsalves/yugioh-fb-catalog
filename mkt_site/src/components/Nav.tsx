import { useEffect, type JSX } from "react";
import { navRoutes } from "../features";
import { CATALOG_SEARCH_ID, isTyping } from "../keyboard";
import { Link, navigate, usePath } from "../router";
import type { RouteId } from "../routes";
import { CardsIcon, DuelistIcon, FusionIcon, HomeIcon } from "./icons";

// Pages kept out of the tab bar (nav: false) need no icon.
const ICONS: Partial<Record<RouteId, () => JSX.Element>> = {
    home: HomeIcon,
    cards: CardsIcon,
    fusion: FusionIcon,
    duelists: DuelistIcon,
};

/** A tab covers its sub-pages too: Cards a shared card's page (/cards/<id>), Duelists a duelist's. */
function isCurrent(path: string, routePath: string): boolean {
    if (routePath === "/") return path === "/";
    return path === routePath || path.startsWith(`${routePath}/`);
}

/**
 * The main navigation (spec 10 F-3): a tab bar at the bottom on phones, tabs in the header from md up (styles in
 * layout.css). With one visible page there is nothing to navigate, so it renders nothing (spec 09 C-1).
 */
export default function Nav() {
    const path = usePath();
    const routes = navRoutes();

    // "/" focuses the card search from any page (spec 06 §4), going to the Cards page first when needed.
    useEffect(() => {
        const focusSearch = () => document.getElementById(CATALOG_SEARCH_ID)?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
            if (document.querySelector('dialog[open], .filters[data-open="true"]')) return;
            event.preventDefault();
            if (document.getElementById(CATALOG_SEARCH_ID)) {
                focusSearch();
            } else {
                navigate("/cards");
                window.requestAnimationFrame(focusSearch);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (routes.length < 2) return null;

    return (
        <nav className="nav" aria-label="Main">
            <ul className="nav__list">
                {routes.map((route) => {
                    const Icon = ICONS[route.id];
                    return (
                        <li key={route.id}>
                            <Link
                                to={route.path}
                                className="nav__link"
                                aria-current={isCurrent(path, route.path) ? "page" : undefined}
                            >
                                {Icon && <Icon />}
                                {route.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
