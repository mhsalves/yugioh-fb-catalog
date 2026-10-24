import { useState } from "react";
import type { DuelistPortrait as Portrait } from "@mhsalves/yugioh-fm-catalog";

/** A duelist's portrait in a round frame (linked from Yugipedia, spec 10 TBD-F6); their initials when it is missing. */
export default function DuelistPortrait({
    name,
    portrait,
    large = false,
}: {
    name: string;
    portrait?: Portrait;
    large?: boolean;
}) {
    const [failed, setFailed] = useState(false);
    const initials = name
        .split(/\s+/)
        .filter((word) => /^[A-Z]/.test(word))
        .map((word) => word[0])
        .join("")
        .slice(-2);
    return (
        <span className={large ? "duelist-portrait duelist-portrait--large" : "duelist-portrait"} aria-hidden="true">
            {portrait && !failed ? (
                <img src={portrait.url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
            ) : (
                initials
            )}
        </span>
    );
}
