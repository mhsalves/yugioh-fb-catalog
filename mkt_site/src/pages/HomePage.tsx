import { useEffect, useMemo, useState, type FormEvent, type JSX, type ReactNode } from "react";
import { getCardImage, getCardList, getRitual, MONSTER_TYPES, TOTAL_CARDS } from "@mhsalves/yugioh-fm-catalog";
import logoUrl from "../assets/logo.svg";
import { catalogUrl } from "../catalogUrl";
import {
    CardsIcon,
    CheckIcon,
    ChevronRightIcon,
    CopyIcon,
    DuelistIcon,
    ExternalIcon,
    FusionIcon,
    GitHubIcon,
    SearchIcon,
} from "../components/icons";
import { isRouteVisible } from "../features";
import { Link, navigate } from "../router";
import { SITE_TITLE, type RouteId } from "../routes";
import { useCopy } from "../useCopy";

const REPOSITORY_URL = "https://github.com/mhsalves/yugioh-fm-catalog";
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
        <span className="home-author__avatar home-author__avatar--initials" aria-hidden="true">
            MA
        </span>
    ) : (
        <img
            className="home-author__avatar"
            src={AUTHOR.avatar}
            width={96}
            height={96}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
        />
    );
}

/** A search box that opens the Cards page with the results; the Cards page has the filters. */
function HomeSearch({ total }: { total: number }) {
    const [text, setText] = useState("");
    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate(catalogUrl({ query: { text: text.trim() || undefined } }));
        window.scrollTo(0, 0);
    };

    return (
        <form role="search" className="home-search" onSubmit={submit}>
            <label htmlFor="home-search" className="visually-hidden">
                Search {total} cards by name, #number or password
            </label>
            <input
                id="home-search"
                type="search"
                className="search"
                placeholder="Name, #number or password"
                value={text}
                onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" className="button">
                <SearchIcon />
                Search
            </button>
        </form>
    );
}

interface QuickLink {
    route: RouteId;
    path: string;
    title: string;
    text: string;
    icon: () => JSX.Element;
}

/**
 * One tile per feature. A feature that is not live yet shows "Coming soon" and no link in production; with previews
 * on it links through, marked "Preview".
 */
function QuickLinkTile({ link, meta }: { link: QuickLink; meta?: string }) {
    const Icon = link.icon;
    const live = link.route === "cards";
    const reachable = isRouteVisible(link.route);
    const body = (
        <>
            <span className="home-tile__icon" aria-hidden="true">
                <Icon />
            </span>
            <span className="home-tile__text">
                <span className="home-tile__title">
                    {link.title}
                    {!live && <span className="sample-tag">{reachable ? "Preview" : "Coming soon"}</span>}
                </span>
                <span className="home-tile__body">{link.text}</span>
                {meta && <span className="home-tile__meta">{meta}</span>}
            </span>
            {reachable && <ChevronRightIcon />}
        </>
    );

    return reachable ? (
        <Link to={link.path} className="home-tile">
            {body}
        </Link>
    ) : (
        <div className="home-tile home-tile--soon">{body}</div>
    );
}

/**
 * The home page: what the project is, a card search, quick links to each feature, special thanks to the sites the
 * card data and images come from, how to use the data, and the author. Figures come from the catalog itself.
 */
export default function HomePage() {
    const figures = useCatalogFigures();
    const fandomImages = figures.imagesBySource.get("Yu-Gi-Oh! Wiki (Fandom)") ?? 0;
    const yugipediaImages = figures.imagesBySource.get("Yugipedia") ?? 0;

    useEffect(() => {
        document.title = SITE_TITLE;
    }, []);

    const links: QuickLink[] = [
        {
            route: "cards",
            path: "/cards",
            title: "Cards",
            text: "Search every card by name, #number or password, and filter by type, monster type, guardian star, level, ATK, DEF or cost.",
            icon: CardsIcon,
        },
        {
            route: "fusion",
            path: "/fusion",
            title: "Fusion",
            text: "What two cards fuse into, and every fusion a card is part of.",
            icon: FusionIcon,
        },
        {
            route: "duelists",
            path: "/duelists",
            title: "Duelists",
            text: "Each duelist's deck and the cards they drop, by rank.",
            icon: DuelistIcon,
        },
    ];

    return (
        <article className="home" aria-labelledby="home-title">
            <header className="home-hero">
                <div className="home-hero__intro">
                    <img src={logoUrl} alt="" width={48} height={48} className="home-hero__logo" />
                    <p className="home-hero__eyebrow">Unofficial fan project</p>
                    <h1 id="home-title">FM Catalog</h1>
                    <p className="home-hero__lead">
                        Every card of <em>Yu-Gi-Oh! Forbidden Memories</em> (PlayStation, 1999), with stats, guardian
                        stars, passwords and ritual recipes, in an open dataset you can browse here or use in your own
                        code.
                    </p>
                    <HomeSearch total={figures.cards} />
                </div>

                <dl className="home-stats" aria-label="The catalog in numbers">
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
                        <dd className="home-stats__mono">{__CATALOG_VERSION__}</dd>
                    </div>
                </dl>
            </header>

            <nav className="home-tiles" aria-label="Features">
                {links.map((link) => (
                    <QuickLinkTile
                        key={link.route}
                        link={link}
                        meta={link.route === "cards" ? `${figures.cards} cards` : undefined}
                    />
                ))}
            </nav>

            <section className="home-section" aria-labelledby="home-thanks">
                <h2 id="home-thanks">Special thanks</h2>
                <p>This project stands on the work of the Yu-Gi-Oh! fan community.</p>
                <ul className="home-thanks">
                    <li className="home-thank">
                        <h3>Yu-Gi-Oh! Wiki (Fandom)</h3>
                        <p>
                            The card data and ritual recipes are imported from the wiki, and {fandomImages} card images
                            are linked from its gallery of Forbidden Memories cards.
                        </p>
                        <ExternalLink href="https://yugioh.fandom.com">
                            yugioh.fandom.com <ExternalIcon />
                        </ExternalLink>
                    </li>
                    <li className="home-thank">
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

            <div className="home-columns">
                <section className="home-section" aria-labelledby="home-data">
                    <h2 id="home-data">Use the data</h2>
                    <p>
                        The cards on this site come from an open-source npm package. It ships the data and the search
                        this site uses, with types, and works in Node and in the browser.
                    </p>
                    <Code code={INSTALL} label="the install command" />
                    <Code code={EXAMPLE} label="the example" />
                    <p className="home-links">
                        <ExternalLink href={NPM_URL}>
                            Package on npm <ExternalIcon />
                        </ExternalLink>
                        <ExternalLink href={REPOSITORY_URL}>
                            Code and docs on GitHub <ExternalIcon />
                        </ExternalLink>
                    </p>
                </section>

                <section className="home-section" aria-labelledby="home-author">
                    <h2 id="home-author">Made by</h2>
                    <div className="home-author">
                        <Avatar />
                        <div className="home-author__text">
                            <h3>{AUTHOR.name}</h3>
                            <p>Built the catalog, its data tools and this site.</p>
                            <p className="home-links">
                                <ExternalLink href={AUTHOR.github}>
                                    <GitHubIcon /> {AUTHOR.handle}
                                </ExternalLink>
                                <ExternalLink href={AUTHOR.home}>
                                    matheusalves.dev <ExternalIcon />
                                </ExternalLink>
                            </p>
                        </div>
                    </div>
                    <div className="home-actions">
                        <ExternalLink href={REPOSITORY_URL} className="button">
                            Star the project on GitHub
                        </ExternalLink>
                        <ExternalLink href={`${REPOSITORY_URL}/issues`} className="button button--ghost">
                            Report an issue
                        </ExternalLink>
                    </div>
                </section>
            </div>
        </article>
    );
}
