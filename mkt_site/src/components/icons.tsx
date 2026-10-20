import type { ReactNode } from "react";

// Inline icons (24×24 stroke paths) so the site needs no icon library.
function Icon({ children }: { children: ReactNode }) {
    return (
        <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export const CopyIcon = () => (
    <Icon>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </Icon>
);

export const CheckIcon = () => (
    <Icon>
        <path d="M20 6 9 17l-5-5" />
    </Icon>
);

export const ExternalIcon = () => (
    <Icon>
        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Icon>
);

export const ShareIcon = () => (
    <Icon>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </Icon>
);

export const CloseIcon = () => (
    <Icon>
        <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
);

export const ChevronLeftIcon = () => (
    <Icon>
        <path d="m15 18-6-6 6-6" />
    </Icon>
);

export const ChevronRightIcon = () => (
    <Icon>
        <path d="m9 18 6-6-6-6" />
    </Icon>
);

export const FilterIcon = () => (
    <Icon>
        <path d="M3 5h18M6 12h12M10 19h4" />
    </Icon>
);

export const SortIcon = ({ descending }: { descending: boolean }) => (
    <Icon>{descending ? <path d="M12 5v14M5 12l7 7 7-7" /> : <path d="M12 19V5M5 12l7-7 7 7" />}</Icon>
);
