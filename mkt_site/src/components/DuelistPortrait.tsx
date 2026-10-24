/** A duelist's initials in a frame, standing in for portraits (spec 10 TBD-F6). */
export default function DuelistPortrait({ name, large = false }: { name: string; large?: boolean }) {
    const initials = name
        .split(/\s+/)
        .filter((word) => /^[A-Z]/.test(word))
        .map((word) => word[0])
        .join("")
        .slice(-2);
    return (
        <span className={large ? "duelist-portrait duelist-portrait--large" : "duelist-portrait"} aria-hidden="true">
            {initials}
        </span>
    );
}
