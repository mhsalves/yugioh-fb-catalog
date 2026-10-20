import { useState } from "react";
import logoUrl from "../assets/logo.svg";
import { Link } from "../router";
import { routes } from "../routes";
import CatalogVersion from "./CatalogVersion";
import { MenuIcon } from "./icons";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="header">
            <div className="header__bar">
                <Link to="/" className="header__brand" onClick={closeMenu}>
                    <img src={logoUrl} alt="" width={32} height={32} />
                    <span>FM Catalog</span>
                </Link>

                <button
                    type="button"
                    className="header__menu-toggle icon-button"
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    aria-controls="site-menu"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <MenuIcon />
                </button>

                <div id="site-menu" className="header__menu" data-open={menuOpen}>
                    <nav aria-label="Pages">
                        <ul className="header__nav">
                            {routes.map((route) => (
                                <li key={route.path}>
                                    <Link to={route.path} onClick={closeMenu}>
                                        {route.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <CatalogVersion />
                </div>
            </div>
        </header>
    );
}
