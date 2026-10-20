import { useEffect } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import CatalogPage from "./pages/CatalogPage";
import NotFoundPage from "./pages/NotFoundPage";
import { usePath } from "./router";

// The site is one page (spec 09 C-1); any other path is the 404 view.
export default function App() {
    const isCatalog = usePath() === "/";

    useEffect(() => {
        if (!isCatalog) document.title = "Page not found · Yu-Gi-Oh! FM Catalog";
    }, [isCatalog]);

    return (
        <>
            <Header />
            <main className="page">{isCatalog ? <CatalogPage /> : <NotFoundPage />}</main>
            <Footer />
        </>
    );
}
