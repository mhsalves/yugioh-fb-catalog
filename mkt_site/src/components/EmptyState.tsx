import type { ReactNode } from "react";

/** An empty card frame with a title, a line of help and one action (spec 09 C-2, shared by every list: spec 10 F-4). */
export default function EmptyState(props: { title: string; children?: ReactNode; action?: ReactNode }) {
    return (
        <div className="empty">
            <div className="empty__frame" aria-hidden="true">
                <span>?</span>
            </div>
            <h2>{props.title}</h2>
            {props.children && <p>{props.children}</p>}
            {props.action}
        </div>
    );
}
