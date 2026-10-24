import { lazy, Suspense, useEffect, type ReactNode } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { isRouteVisible } from "./features";
import CardPage from "./pages/CardPage";
import CatalogPage from "./pages/CatalogPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { navigate, usePath, useSearch } from "./router";
import { SITE_TITLE } from "./routes";

// Preview features load on demand, so the catalog does not pay for their code (spec 10 F-2).
const FusionPage = lazy(() => import("./pages/FusionPage"));
const DuelistsPage = lazy(() => import("./pages/DuelistsPage"));
const DuelistPage = lazy(() => import("./pages/DuelistPage"));

/** The page for a path, or undefined for the 404 view. Pages of features that are not visible are 404s (routes.ts). */
function pageFor(path: string): ReactNode | undefined {
    if (path === "/") return <HomePage />;
    if (path === "/cards") return <CatalogPage />;
    // /cards/<id>/ is a card's own page, reached through a shared link (spec 09 C-7).
    const cardId = path.match(/^\/cards\/(\d+)$/)?.[1];
    if (cardId !== undefined) return <CardPage id={Number(cardId)} />;
    if (path === "/fusion" && isRouteVisible("fusion")) return <FusionPage />;
    if (isRouteVisible("duelists")) {
        if (path === "/duelists") return <DuelistsPage />;
        const duelistId = path.match(/^\/duelists\/([\w-]+)$/)?.[1];
        if (duelistId !== undefined) return <DuelistPage id={duelistId} />;
    }
    return undefined;
}

/**
 * Where an older address now lives: the catalog moved from "/" to "/cards" when the home page took the root, so a
 * shared "/?type=Monster&card=425" still opens the same view; "/about" became the home page.
 */
function movedTo(path: string, search: string): string | undefined {
    if (path === "/about") return "/";
    if (path === "/" && search !== "" && search !== "?") {
        const params = new URLSearchParams(search);
        params.delete("preview");
        if ([...params.keys()].length > 0) return `/cards${search}`;
    }
    return undefined;
}

export default function App() {
    const path = usePath();
    const search = useSearch();
    const moved = movedTo(path, search);
    const page = moved ? undefined : pageFor(path);
    const notFound = !moved && page === undefined;

    useEffect(() => {
        if (moved) navigate(moved, { replace: true, state: window.history.state });
    }, [moved]);

    useEffect(() => {
        if (notFound) document.title = `Page not found · ${SITE_TITLE}`;
    }, [notFound]);

    return (
        <>
            <Header />
            <main className="page">
                <Suspense fallback={<p className="hint">Loading…</p>}>{notFound ? <NotFoundPage /> : page}</Suspense>
            </main>
            <Footer />
        </>
    );
}
