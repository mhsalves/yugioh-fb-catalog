import type { ReactNode } from "react";
import { Link } from "../router";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
            <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
    );
}

/**
 * Two short lines on every page: the author and the way to the full credits (the home page), then the fan-project
 * notice and image attribution (spec 09 TBD-C4, spec 08 I-5). The full thanks and author links live on the home page.
 */
export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__bar">
                <p className="footer__credit">
                    Made by <ExternalLink href="https://github.com/mhsalves">Matheus Alves</ExternalLink>
                    <span aria-hidden="true"> · </span>
                    <Link to="/">About &amp; credits</Link>
                </p>
                <p className="footer__notice">
                    Unofficial fan project. Yu-Gi-Oh! © Kazuki Takahashi / Konami. Card images:{" "}
                    <ExternalLink href="https://yugioh.fandom.com">Yu-Gi-Oh! Wiki</ExternalLink>,{" "}
                    <ExternalLink href="https://yugipedia.com">Yugipedia</ExternalLink>.
                </p>
            </div>
        </footer>
    );
}
