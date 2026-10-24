// Every page of the site, listed once (spec 10 F-2). Plain data, so the build (build/cardPages.ts) can read it too.

/**
 * live: in the navigation, static pages and the sitemap.
 * preview: reachable and in the navigation only with previews on (features.ts); never in the sitemap.
 * hidden: the 404 view everywhere.
 */
export type FeatureStatus = "live" | "preview" | "hidden";

// No separate search page: the Cards search box covers names, #numbers and passwords (spec 10 F-7, as built).
export type RouteId = "cards" | "fusion" | "duelists";

export interface RouteMeta {
    id: RouteId;
    path: string;
    /** Navigation label. */
    label: string;
    /** Page title, before " · Yu-Gi-Oh! FM Catalog". */
    title: string;
    description: string;
    status: FeatureStatus;
}

export const SITE_TITLE = "Yu-Gi-Oh! FM Catalog";

export const ROUTES: readonly RouteMeta[] = [
    {
        id: "cards",
        path: "/",
        label: "Cards",
        title: "Cards",
        description:
            "Card data for Yu-Gi-Oh! Forbidden Memories: stats, passwords and more, from the open-source npm catalog.",
        status: "live",
    },
    {
        id: "fusion",
        path: "/fusion",
        label: "Fusion",
        title: "Fusion",
        description: "What two Yu-Gi-Oh! Forbidden Memories cards fuse into, and every fusion a card is part of.",
        // Sample data until the catalog has fusions (spec 04 Q-5, src/data/pending.ts).
        status: "preview",
    },
    {
        id: "duelists",
        path: "/duelists",
        label: "Duelists",
        title: "Duelists",
        description: "Yu-Gi-Oh! Forbidden Memories duelists, their decks and the cards they drop.",
        // Sample data until the catalog has duelists (spec 02 TBD-D9, src/data/pending.ts).
        status: "preview",
    },
];

export const routeMeta = (id: RouteId): RouteMeta => ROUTES.find((route) => route.id === id)!;
