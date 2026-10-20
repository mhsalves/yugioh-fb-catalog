import type { ICard } from "@mhsalves/yugioh-fb-catalog";
import { cardPath, href } from "../router";
import { useCopy } from "../useCopy";
import { CheckIcon, ShareIcon } from "./icons";

/** Shares a card's own page (spec 09 C-7): the system share sheet where there is one, otherwise copies the link. */
export default function ShareButton({ card }: { card: ICard }) {
    const [state, copy] = useCopy();
    const url = new URL(href(cardPath(card.id)), window.location.origin).toString();

    const share = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: card.name, url });
                return;
            } catch (error) {
                // Cancelled by the user: nothing to do. Any other failure falls back to copying.
                if ((error as DOMException).name === "AbortError") return;
            }
        }
        await copy(url);
    };

    return (
        <>
            <button type="button" className="button button--ghost button--small" onClick={share}>
                {state === "copied" ? <CheckIcon /> : <ShareIcon />}
                {state === "copied" ? "Link copied" : "Share"}
            </button>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Link copied" : state === "failed" ? "Could not copy the link" : ""}
            </span>
        </>
    );
}
