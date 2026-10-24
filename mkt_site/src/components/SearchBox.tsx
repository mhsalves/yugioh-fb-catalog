import { useEffect, useState } from "react";

interface SearchBoxProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    id?: string;
    autoFocus?: boolean;
}

/** A search field whose text is debounced before it reaches the URL. */
export default function SearchBox({ value, onChange, label, placeholder = label, id, autoFocus }: SearchBoxProps) {
    const [draft, setDraft] = useState(value);
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        // The URL changed from outside (Clear, Back): show it.
        setLastValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 150);
        return () => window.clearTimeout(timer);
    }, [draft, value, onChange]);

    return (
        <input
            id={id}
            type="search"
            className="search"
            placeholder={placeholder}
            aria-label={label}
            value={draft}
            autoFocus={autoFocus}
            onChange={(event) => setDraft(event.target.value)}
        />
    );
}
