import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts from 0 up to `target` with an ease-out curve, for numbers that appear with a page (duelist stats). Shows
 * `target` right away for people who ask for less motion. Remount (a new `key`) to count again.
 */
export function useCountUp(target: number, duration = 700): number {
    const [reduce] = useState(prefersReducedMotion);
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (reduce) return;
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            setValue(Math.round(target * (1 - (1 - progress) ** 3)));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [reduce, target, duration]);

    return reduce ? target : value;
}
