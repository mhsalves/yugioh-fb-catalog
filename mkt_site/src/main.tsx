import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Mobile first (spec 10 F-1), in cascade order: later files build on earlier ones.
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/catalog.css";
import "./styles/card-panel.css";
import "./styles/features.css";
import "./styles/motion.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
