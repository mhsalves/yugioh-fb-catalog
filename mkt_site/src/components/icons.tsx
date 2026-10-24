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

export const GitHubIcon = () => (
    <Icon>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
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

export const CardsIcon = () => (
    <Icon>
        <rect x="4" y="3" width="11" height="15" rx="1.5" />
        <path d="M8 21h10a2 2 0 0 0 2-2V7" />
    </Icon>
);

export const FusionIcon = () => (
    <Icon>
        <circle cx="8" cy="9" r="5" />
        <circle cx="16" cy="9" r="5" />
        <path d="M12 14v7M9 18h6" />
    </Icon>
);

export const DuelistIcon = () => (
    <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
);

export const InfoIcon = () => (
    <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
    </Icon>
);

export const PlusIcon = () => (
    <Icon>
        <path d="M12 5v14M5 12h14" />
    </Icon>
);

export const SwapIcon = () => (
    <Icon>
        <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
    </Icon>
);

export const SortIcon = ({ descending }: { descending: boolean }) => (
    <Icon>{descending ? <path d="M12 5v14M5 12l7 7 7-7" /> : <path d="M12 19V5M5 12l7-7 7 7" />}</Icon>
);
