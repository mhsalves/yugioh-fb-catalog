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

export const MenuIcon = () => (
    <Icon>
        <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
);
