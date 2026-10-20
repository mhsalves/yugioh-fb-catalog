import { useEffect, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/** Copies text to the clipboard; the state resets to "idle" two seconds after each copy. */
export function useCopy(): [CopyState, (text: string) => Promise<void>] {
    const [state, setState] = useState<CopyState>("idle");

    useEffect(() => {
        if (state === "idle") return;
        const timer = window.setTimeout(() => setState("idle"), 2000);
        return () => window.clearTimeout(timer);
    }, [state]);

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setState("copied");
        } catch {
            setState("failed");
        }
    };

    return [state, copy];
}
