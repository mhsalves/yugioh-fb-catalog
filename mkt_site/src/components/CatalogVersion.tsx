import { useState, type ReactNode } from "react";
import { getCardList, TOTAL_CARDS } from "@mhsalves/yugioh-fb-catalog";
import { Link } from "../router";
import { useCopy } from "../useCopy";
import Sheet from "./Sheet";
import { CheckIcon, ChevronRightIcon, CopyIcon, ExternalIcon, GitHubIcon, InfoIcon } from "./icons";

const PACKAGE_SPEC = `${__CATALOG_NAME__}@${__CATALOG_VERSION__}`;
const NPM_URL = `https://www.npmjs.com/package/${__CATALOG_NAME__}/v/${__CATALOG_VERSION__}`;
const REPOSITORY_URL = "https://github.com/mhsalves/yugioh-fb-catalog";

function CopyPackage({ className }: { className: string }) {
    const [state, copy] = useCopy();
    return (
        <>
            <button
                type="button"
                className={className}
                title={`Copy ${PACKAGE_SPEC}`}
                aria-label={`Catalog version ${__CATALOG_VERSION__}. Copy ${PACKAGE_SPEC}`}
                onClick={() => copy(PACKAGE_SPEC)}
            >
                <span>{PACKAGE_SPEC}</span>
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </>
    );
}

function ExternalLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
    return (
        <a className={className} href={href} target="_blank" rel="noopener noreferrer">
            {children}
            <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
    );
}

/**
 * The catalog version the site is built with: copy `name@version`, or open it on npm or GitHub. From md up it sits
 * in the header; on phones a short version button opens the same actions in a sheet, so the header stays one line.
 */
export default function CatalogVersion() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="catalog-version">
                <CopyPackage className="catalog-version__copy" />
                <ExternalLink href={NPM_URL} className="catalog-version__link">
                    npm
                    <ExternalIcon />
                </ExternalLink>
                <ExternalLink href={REPOSITORY_URL} className="catalog-version__link">
                    <GitHubIcon />
                    GitHub
                </ExternalLink>
            </div>

            <button
                type="button"
                className="catalog-version__compact"
                aria-haspopup="dialog"
                aria-label={`Catalog version ${__CATALOG_VERSION__}: package, npm and GitHub`}
                onClick={() => setOpen(true)}
            >
                v{__CATALOG_VERSION__}
            </button>
            <Sheet open={open} title="About the catalog" onClose={() => setOpen(false)}>
                <p className="hint">
                    This site shows {getCardList().length} of {TOTAL_CARDS} cards from the open-source npm catalog,
                    version {__CATALOG_VERSION__}.
                </p>
                <CopyPackage className="catalog-version__copy catalog-version__copy--block" />
                <ul className="link-list">
                    <li>
                        <Link to="/" className="link-list__item" onClick={() => setOpen(false)}>
                            <InfoIcon />
                            <span>About this project</span>
                            <ChevronRightIcon />
                        </Link>
                    </li>
                    <li>
                        <ExternalLink href={NPM_URL} className="link-list__item">
                            <ExternalIcon />
                            <span>Open on npm</span>
                            <ChevronRightIcon />
                        </ExternalLink>
                    </li>
                    <li>
                        <ExternalLink href={REPOSITORY_URL} className="link-list__item">
                            <GitHubIcon />
                            <span>Source on GitHub</span>
                            <ChevronRightIcon />
                        </ExternalLink>
                    </li>
                </ul>
            </Sheet>
        </>
    );
}
