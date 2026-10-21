import { useCopy } from "../useCopy";
import { CheckIcon, CopyIcon, ExternalIcon, GitHubIcon } from "./icons";

const PACKAGE_SPEC = `${__CATALOG_NAME__}@${__CATALOG_VERSION__}`;
const NPM_URL = `https://www.npmjs.com/package/${__CATALOG_NAME__}/v/${__CATALOG_VERSION__}`;
const REPOSITORY_URL = "https://github.com/mhsalves/yugioh-fb-catalog";

/** The catalog version the site is built with: click to copy `name@version`, or open it on npm or GitHub. */
export default function CatalogVersion() {
    const [state, copy] = useCopy();

    return (
        <div className="catalog-version">
            <button
                type="button"
                className="catalog-version__copy"
                title={`Copy ${PACKAGE_SPEC}`}
                aria-label={`Catalog version ${__CATALOG_VERSION__}. Copy ${PACKAGE_SPEC}`}
                onClick={() => copy(PACKAGE_SPEC)}
            >
                <span>{PACKAGE_SPEC}</span>
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <a className="catalog-version__link" href={NPM_URL} target="_blank" rel="noopener noreferrer">
                npm
                <ExternalIcon />
                <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <a className="catalog-version__link" href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
                GitHub
                <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </div>
    );
}
