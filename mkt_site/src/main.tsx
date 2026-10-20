import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { currentPath, href } from "./router";
import "./styles.css";

// Per-card pages (spec 09 C-7) live at /cards/<id>/; inside the app they are the catalog with that card open.
const cardPage = currentPath().match(/^\/cards\/(\d+)$/);
if (cardPage) window.history.replaceState(null, "", href(`/?card=${cardPage[1]}`));

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
