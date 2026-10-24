import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getCardImage, getCardList, getRitual, MONSTER_TYPES, TOTAL_CARDS } from "@mhsalves/yugioh-fb-catalog";
import logoUrl from "../assets/logo.svg";
import { CheckIcon, CopyIcon, ExternalIcon, GitHubIcon } from "../components/icons";
import { Link } from "../router";
import { SITE_TITLE } from "../routes";
import { useCopy } from "../useCopy";

const REPOSITORY_URL = "https://github.com/mhsalves/yugioh-fb-catalog";
const NPM_URL = `https://www.npmjs.com/package/${__CATALOG_NAME__}`;
const AUTHOR = {
    name: "Matheus Alves",
    github: "https://github.com/mhsalves",
    handle: "@mhsalves",
    home: "https://matheusalves.dev",
    avatar: "https://github.com/mhsalves.png?size=192",
};
const INSTALL = `npm install ${__CATALOG_NAME__}`;
const EXAMPLE = `import { searchCards } from "${__CATALOG_NAME__}";

// The strongest Dragons first
const dragons = searchCards({
    monsterType: "Dragon",
    sort: { by: "attack", dir: "desc" },
});`;

/** Figures shown on the page, read from the catalog so they never go stale. */
function useCatalogFigures() {
    return useMemo(() => {
        const cards = getCardList();
        const imagesBySource = new Map<string, number>();
        for (const card of cards) {
            const source = getCardImage(card.id)?.source.name;
            if (source) imagesBySource.set(source, (imagesBySource.get(source) ?? 0) + 1);
        }
        return {
            cards: cards.length,
            rituals: cards.filter((card) => card.cardType === "Ritual" && getRitual(card.id)).length,
            imagesBySource,
        };
    }, []);
}

function ExternalLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
    return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer">
            {children}
            <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
    );
}

/** A code block with a copy button. */
function Code({ code, label }: { code: string; label: string }) {
    const [state, copy] = useCopy();
    return (
        <div className="code">
            <pre>
                <code>{code}</code>
            </pre>
            <button
                type="button"
                className="icon-button icon-button--small code__copy"
                aria-label={`Copy ${label}`}
                onClick={() => copy(code)}
            >
                {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            </button>
            <span className="visually-hidden" role="status">
                {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : ""}
            </span>
        </div>
    );
}

/** The author's GitHub picture, or initials when it cannot load. */
function Avatar() {
    const [failed, setFailed] = useState(false);
    return failed ? (
        <span className="about-author__avatar about-author__avatar--initials" aria-hidden="true">
            MA
        </span>
    ) : (
        <img
            className="about-author__avatar"
            src={AUTHOR.avatar}
            width={96}
            height={96}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}

const FEATURES = [
    {
        title: "Search and filter",
        text: "Find any card by name, by number (#425) or by password, and narrow the list by type, monster type, guardian star, level, ATK, DEF or cost.",
    },
    {
        title: "Every card's details",
        text: "Stats, guardian stars and who they beat, the password with a copy button, its starchip cost and ritual recipes, with a link to share each card.",
    },
    {
        title: "Fusions",
        text: "What two cards fuse into, and every fusion a card is part of.",
        soon: true,
    },
    {
        title: "Duelists and drops",
        text: "Each duelist's deck and the cards they drop, by rank.",
        soon: true,
    },
];

/**
 * About the project: what it is, what the site does, how to use the data, special thanks to the sites the card data
 * and images come from, and the author. Figures come from the catalog itself.
 */
export default function AboutPage() {
    const figures = useCatalogFigures();
    const fandomImages = figures.imagesBySource.get("Yu-Gi-Oh! Wiki (Fandom)") ?? 0;
    const yugipediaImages = figures.imagesBySource.get("Yugipedia") ?? 0;

    useEffect(() => {
        document.title = `About · ${SITE_TITLE}`;
    }, []);

    return (
        <article className="about" aria-labelledby="about-title">
            <header className="about-hero">
                <img src={logoUrl} alt="" width={56} height={56} className="about-hero__logo" />
                <p className="about-hero__eyebrow">Unofficial fan project</p>
                <h1 id="about-title">FM Catalog</h1>
                <p className="about-hero__lead">
                    Every card of <em>Yu-Gi-Oh! Forbidden Memories</em> (PlayStation, 1999), with stats, guardian stars,
                    passwords and ritual recipes, in an open dataset you can browse here or use in your own code.
                </p>
                <div className="about-hero__actions">
                    <Link to="/" className="button">
                        Browse the cards
                    </Link>
                    <ExternalLink href={REPOSITORY_URL} className="button button--ghost">
                        <GitHubIcon /> Source on GitHub
                    </ExternalLink>
                </div>
            </header>

            <section aria-label="The catalog in numbers">
                <dl className="about-stats">
                    <div>
                        <dt>Cards catalogued</dt>
                        <dd>
                            {figures.cards}
                            <span> of {TOTAL_CARDS}</span>
                        </dd>
                    </div>
                    <div>
                        <dt>Monster types</dt>
                        <dd>{MONSTER_TYPES.length}</dd>
                    </div>
                    <div>
                        <dt>Ritual recipes</dt>
                        <dd>{figures.rituals}</dd>
                    </div>
                    <div>
                        <dt>Catalog version</dt>
                        <dd className="about-stats__mono">{__CATALOG_VERSION__}</dd>
                    </div>
                </dl>
            </section>

            <section className="about-section" aria-labelledby="about-features">
                <h2 id="about-features">What you can do</h2>
                <ul className="about-features">
                    {FEATURES.map((feature) => (
                        <li key={feature.title} className="about-feature">
                            <h3>
                                {feature.title}
                                {feature.soon && <span className="sample-tag">Coming soon</span>}
                            </h3>
                            <p>{feature.text}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="about-section" aria-labelledby="about-data">
                <h2 id="about-data">Use the data</h2>
                <p>
                    The cards on this site come from an open-source npm package. It ships the data and the search this
                    page uses, with types, and works in Node and in the browser.
                </p>
                <Code code={INSTALL} label="the install command" />
                <Code code={EXAMPLE} label="the example" />
                <p className="about-links">
                    <ExternalLink href={NPM_URL}>
                        Package on npm <ExternalIcon />
                    </ExternalLink>
                    <ExternalLink href={REPOSITORY_URL}>
                        Code and docs on GitHub <ExternalIcon />
                    </ExternalLink>
                </p>
            </section>

            <section className="about-section" aria-labelledby="about-thanks">
                <h2 id="about-thanks">Special thanks</h2>
                <p>This project stands on the work of the Yu-Gi-Oh! fan community.</p>
                <ul className="about-thanks">
                    <li className="about-thank">
                        <h3>Yu-Gi-Oh! Wiki (Fandom)</h3>
                        <p>
                            The card data and ritual recipes are imported from the wiki, and {fandomImages} card images
                            are linked from its gallery of Forbidden Memories cards.
                        </p>
                        <ExternalLink href="https://yugioh.fandom.com">
                            yugioh.fandom.com <ExternalIcon />
                        </ExternalLink>
                    </li>
                    <li className="about-thank">
                        <h3>Yugipedia</h3>
                        <p>
                            {yugipediaImages} card images come from Yugipedia, for the cards the Fandom wiki only shows
                            as the card back.
                        </p>
                        <ExternalLink href="https://yugipedia.com">
                            yugipedia.com <ExternalIcon />
                        </ExternalLink>
                    </li>
                </ul>
                <p className="hint">
                    Images are linked, never copied: they stay hosted by these sites, and every card credits its source.
                    Yu-Gi-Oh! and its card artwork are © Kazuki Takahashi / Konami. This is an unofficial fan project,
                    not affiliated with or endorsed by Konami.
                </p>
            </section>

            <section className="about-section" aria-labelledby="about-author">
                <h2 id="about-author">Made by</h2>
                <div className="about-author">
                    <Avatar />
                    <div className="about-author__text">
                        <h3>{AUTHOR.name}</h3>
                        <p>Built the catalog, its data tools and this site.</p>
                        <p className="about-links">
                            <ExternalLink href={AUTHOR.github}>
                                <GitHubIcon /> {AUTHOR.handle}
                            </ExternalLink>
                            <ExternalLink href={AUTHOR.home}>
                                matheusalves.dev <ExternalIcon />
                            </ExternalLink>
                        </p>
                    </div>
                </div>
                <div className="about-hero__actions">
                    <ExternalLink href={REPOSITORY_URL} className="button">
                        Star the project on GitHub
                    </ExternalLink>
                    <ExternalLink href={`${REPOSITORY_URL}/issues`} className="button button--ghost">
                        Report an issue
                    </ExternalLink>
                </div>
            </section>
        </article>
    );
}
