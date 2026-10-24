import { lazy, Suspense, useEffect, type ReactNode } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { isRouteVisible } from "./features";
import CardPage from "./pages/CardPage";
import CatalogPage from "./pages/CatalogPage";
import NotFoundPage from "./pages/NotFoundPage";
import { usePath } from "./router";
import { SITE_TITLE } from "./routes";

// Preview features and About load on demand, so the catalog does not pay for their code (spec 10 F-2).
const FusionPage = lazy(() => import("./pages/FusionPage"));
const DuelistsPage = lazy(() => import("./pages/DuelistsPage"));
const DuelistPage = lazy(() => import("./pages/DuelistPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

/** The page for a path, or undefined for the 404 view. Pages of features that are not visible are 404s (routes.ts). */
function pageFor(path: string): ReactNode | undefined {
    if (path === "/") return <CatalogPage />;
    // /cards/<id>/ is a card's own page, reached through a shared link (spec 09 C-7).
    const cardId = path.match(/^\/cards\/(\d+)$/)?.[1];
    if (cardId !== undefined) return <CardPage id={Number(cardId)} />;
    if (path === "/fusion" && isRouteVisible("fusion")) return <FusionPage />;
    if (path === "/about" && isRouteVisible("about")) return <AboutPage />;
    if (isRouteVisible("duelists")) {
        if (path === "/duelists") return <DuelistsPage />;
        const duelistId = path.match(/^\/duelists\/([\w-]+)$/)?.[1];
        if (duelistId !== undefined) return <DuelistPage id={duelistId} />;
    }
    return undefined;
}

export default function App() {
    const path = usePath();
    const page = pageFor(path);
    const notFound = page === undefined;

    useEffect(() => {
        if (notFound) document.title = `Page not found · ${SITE_TITLE}`;
    }, [notFound]);

    return (
        <>
            <Header />
            <main className="page">
                <Suspense fallback={<p className="hint">Loading…</p>}>{page ?? <NotFoundPage />}</Suspense>
            </main>
            <Footer />
        </>
    );
}
