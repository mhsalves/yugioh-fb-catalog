import { Link } from "../router";

export default function NotFoundPage() {
    return (
        <section className="hero">
            <h1>Page not found</h1>
            <p>This page does not exist.</p>
            <p>
                <Link to="/">Back to the catalog</Link>
            </p>
        </section>
    );
}
