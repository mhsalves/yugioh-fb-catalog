import { ExternalIcon } from "./icons";

const LINKS = [
    { label: "Home page", url: "https://matheusalves.dev" },
    { label: "GitHub", url: "https://github.com/mhsalves" },
];

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__bar">
                <p>Made by Matheus Alves</p>
                <ul className="footer__links">
                    {LINKS.map((link) => (
                        <li key={link.url}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.label}
                                <ExternalIcon />
                                <span className="visually-hidden"> (opens in a new tab)</span>
                            </a>
                        </li>
                    ))}
                </ul>
                {/* Fan-project notice (spec 09 TBD-C4) and image attribution (spec 08 I-5). */}
                <p className="footer__notice">
                    Card images are hosted by and linked from the{" "}
                    <a href="https://yugioh.fandom.com" target="_blank" rel="noopener noreferrer">
                        Yu-Gi-Oh! Wiki
                        <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>{" "}
                    (Fandom) and{" "}
                    <a href="https://yugipedia.com" target="_blank" rel="noopener noreferrer">
                        Yugipedia
                        <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                    . Yu-Gi-Oh! and its card artwork are © Kazuki Takahashi / Konami. Unofficial fan project.
                </p>
            </div>
        </footer>
    );
}
