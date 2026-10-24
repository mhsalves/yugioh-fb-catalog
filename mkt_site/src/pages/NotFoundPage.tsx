import { Link } from "../router";

export default function NotFoundPage() {
    return (
        <section className="hero">
            <h1>Page not found</h1>
            <p>This page does not exist.</p>
            <p>
                <Link to="/cards">Browse the cards</Link> or <Link to="/">go home</Link>
            </p>
        </section>
    );
}
