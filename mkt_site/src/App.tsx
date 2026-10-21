import { useEffect } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import CardPage from "./pages/CardPage";
import CatalogPage from "./pages/CatalogPage";
import NotFoundPage from "./pages/NotFoundPage";
import { usePath } from "./router";

// The catalog is the site's one page (spec 09 C-1). /cards/<id>/ is a card's own page, reached through a shared
// link (C-7). Any other path is the 404 view.
export default function App() {
    const path = usePath();
    const cardId = path.match(/^\/cards\/(\d+)$/)?.[1];
    const isCatalog = path === "/";

    useEffect(() => {
        if (!isCatalog && cardId === undefined) document.title = "Page not found · Yu-Gi-Oh! FM Catalog";
    }, [isCatalog, cardId]);

    return (
        <>
            <Header />
            <main className="page">
                {isCatalog ? (
                    <CatalogPage />
                ) : cardId !== undefined ? (
                    <CardPage id={Number(cardId)} />
                ) : (
                    <NotFoundPage />
                )}
            </main>
            <Footer />
        </>
    );
}
