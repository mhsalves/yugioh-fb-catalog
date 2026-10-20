import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, ExternalIcon } from "./icons";

const PACKAGE_SPEC = `${__CATALOG_NAME__}@${__CATALOG_VERSION__}`;
const NPM_URL = `https://www.npmjs.com/package/${__CATALOG_NAME__}/v/${__CATALOG_VERSION__}`;

type CopyState = "idle" | "copied" | "failed";

/** The catalog version the site is built with: click to copy `name@version`, or open it on npm. */
export default function CatalogVersion() {
    const [state, setState] = useState<CopyState>("idle");

    useEffect(() => {
        if (state === "idle") return;
        const timer = window.setTimeout(() => setState("idle"), 2000);
        return () => window.clearTimeout(timer);
    }, [state]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(PACKAGE_SPEC);
            setState("copied");
        } catch {
            setState("failed");
        }
    };

    return (
        <div className="catalog-version">
            <button
                type="button"
                className="catalog-version__copy"
                title={`Copy ${PACKAGE_SPEC}`}
                aria-label={`Catalog version ${__CATALOG_VERSION__}. Copy ${PACKAGE_SPEC}`}
                onClick={copy}
            >
                <span>v{__CATALOG_VERSION__}</span>
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <a className="catalog-version__npm" href={NPM_URL} target="_blank" rel="noopener noreferrer">
                npm
                <ExternalIcon />
                <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </div>
    );
}
