import { pendingFor } from "../data/pending";
import type { RouteId } from "../routes";

/**
 * Says that a preview feature shows sample data (spec 10 F-2, F-6), and which catalog methods it waits for, so
 * nobody takes it for game data.
 */
export default function PreviewBanner({ route }: { route: RouteId }) {
    const methods = pendingFor(route).filter((method) => method.mock === "sample data");
    return (
        <aside className="preview-banner" aria-label="Preview">
            <strong>Preview with sample data</strong>
            <p>
                The cards are real, but what this page says about them is made up. It is waiting for the catalog to add{" "}
                {methods.map((method, index) => (
                    <span key={method.name}>
                        {index > 0 && (index === methods.length - 1 ? " and " : ", ")}
                        <code>{method.name}</code>
                    </span>
                ))}
                .
            </p>
        </aside>
    );
}
