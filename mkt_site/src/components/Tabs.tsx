import type { KeyboardEvent } from "react";

interface TabsProps<T extends string> {
    label: string;
    /** Prefix for the tab and panel ids; the panel takes `tabPanelProps(idPrefix, selected)`. */
    idPrefix: string;
    tabs: readonly { id: T; label: string }[];
    selected: T;
    onSelect: (id: T) => void;
}

const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;

/** Props for the panel the tabs control. */
export const tabPanelProps = (prefix: string, selected: string) => ({
    id: `${prefix}-panel`,
    role: "tabpanel",
    "aria-labelledby": tabId(prefix, selected),
});

/** Sections inside a page (spec 10 F-4): a tab list with arrow-key, Home and End movement. */
export default function Tabs<T extends string>({ label, idPrefix, tabs, selected, onSelect }: TabsProps<T>) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const index = tabs.findIndex((tab) => tab.id === selected);
        const moves: Record<string, number> = {
            ArrowLeft: index - 1,
            ArrowRight: index + 1,
            Home: 0,
            End: tabs.length - 1,
        };
        if (!(event.key in moves)) return;
        event.preventDefault();
        const next = tabs[(moves[event.key] + tabs.length) % tabs.length];
        onSelect(next.id);
        document.getElementById(tabId(idPrefix, next.id))?.focus();
    };

    return (
        <div className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={tabId(idPrefix, tab.id)}
                    className="tabs__tab"
                    aria-selected={tab.id === selected}
                    aria-controls={`${idPrefix}-panel`}
                    tabIndex={tab.id === selected ? 0 : -1}
                    onClick={() => onSelect(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
