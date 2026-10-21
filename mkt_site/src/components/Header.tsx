import logoUrl from "../assets/logo.svg";
import { Link } from "../router";
import CatalogVersion from "./CatalogVersion";

export default function Header() {
    return (
        <header className="header">
            <div className="header__bar">
                <Link to="/" className="header__brand" aria-label="FM Catalog, back to the full catalog">
                    <img src={logoUrl} alt="" width={32} height={32} />
                    <span className="header__brand-text">FM Catalog</span>
                </Link>
                <CatalogVersion />
            </div>
        </header>
    );
}
