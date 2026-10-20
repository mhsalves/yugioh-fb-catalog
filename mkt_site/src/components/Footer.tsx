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
            </div>
        </footer>
    );
}
