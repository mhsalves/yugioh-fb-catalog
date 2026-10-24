import { ROUTES, routeMeta, type RouteId, type RouteMeta } from "./routes";

// Feature flags (spec 10 F-2). Preview features show in `yarn dev`, or after opening any page with ?preview=1
// (remembered for the browser session; ?preview=0 turns it off). Production visitors never see them otherwise.

const PREVIEW_KEY = "fm:preview";

function readPreview(): boolean {
    if (import.meta.env.DEV) return true;
    const param = new URLSearchParams(window.location.search).get("preview");
    try {
        if (param === "1") window.sessionStorage.setItem(PREVIEW_KEY, "1");
        if (param === "0") window.sessionStorage.removeItem(PREVIEW_KEY);
        return window.sessionStorage.getItem(PREVIEW_KEY) === "1";
    } catch {
        // Storage blocked: previews last for this page load only.
        return param === "1";
    }
}

export const PREVIEW = readPreview();

export const isVisible = (route: RouteMeta) => route.status === "live" || (route.status === "preview" && PREVIEW);

export const isRouteVisible = (id: RouteId) => isVisible(routeMeta(id));

export const visibleRoutes = () => ROUTES.filter(isVisible);
