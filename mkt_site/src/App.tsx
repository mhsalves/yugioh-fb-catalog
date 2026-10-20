import { useEffect } from "react";
import Header from "./components/Header";
import NotFoundPage from "./pages/NotFoundPage";
import { usePath } from "./router";
import { routes } from "./routes";

export default function App() {
    const path = usePath();
    const route = routes.find((r) => r.path === path);
    const Page = route?.component ?? NotFoundPage;

    useEffect(() => {
        document.title = route ? route.title : "Page not found · Yu-Gi-Oh! FM Catalog";
    }, [route]);

    return (
        <>
            <Header />
            <main className="page">
                <Page />
            </main>
        </>
    );
}
