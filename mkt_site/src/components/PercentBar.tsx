/** A rate as a bar and a number (spec 10 F-4), for drop and deck rates. The bar is scaled to `max`, the list's top rate. */
export default function PercentBar({ value, max = 100 }: { value: number; max?: number }) {
    return (
        <span className="percent">
            <span className="percent__track" aria-hidden="true">
                <span className="percent__fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
            </span>
            <span className="percent__value">{`${value.toFixed(value < 10 ? 2 : 1)}%`}</span>
        </span>
    );
}
