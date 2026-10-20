import type { ComponentType } from "react";
import HomePage from "./pages/HomePage";

export interface Route {
    path: string;
    /** Label in the header menu. */
    label: string;
    title: string;
    component: ComponentType;
}

// Add a page here and it shows up in the header menu (spec 06 U-2).
export const routes: Route[] = [{ path: "/", label: "Home", title: "Yu-Gi-Oh! FM Catalog", component: HomePage }];
