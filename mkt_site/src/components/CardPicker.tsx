import { useMemo, useState } from "react";
import { searchCards, type CardId, type CardQuery } from "@mhsalves/yugioh-fb-catalog";
import CardRow from "./CardRow";
import Sheet from "./Sheet";

const LIMIT = 50;

interface CardPickerProps {
    open: boolean;
    title: string;
    onPick: (id: CardId) => void;
    onClose: () => void;
    /** Fixed limits on what can be picked, such as monsters only (not a user filter: spec 10 F-7). */
    query?: CardQuery;
}

/** Search the catalog and pick one card (spec 10 F-4), in a Sheet. */
export default function CardPicker({ open, title, onPick, onClose, query }: CardPickerProps) {
    const [text, setText] = useState("");
    const result = useMemo(
        () => searchCards({ ...query, text: text.trim() || undefined, limit: LIMIT }),
        [query, text],
    );

    return (
        <Sheet open={open} title={title} onClose={onClose}>
            <input
                type="search"
                className="search"
                placeholder="Search by name"
                aria-label="Search by name"
                data-autofocus
                value={text}
                onChange={(event) => setText(event.target.value)}
            />
            <p className="summary" role="status">
                {result.total} {result.total === 1 ? "card" : "cards"}
                {result.total > result.items.length && `, showing the first ${result.items.length}`}
            </p>
            <ul className="card-rows">
                {result.items.map((card) => (
                    <li key={card.id}>
                        <CardRow
                            card={card}
                            onOpen={(id) => {
                                onPick(id);
                                onClose();
                            }}
                        />
                    </li>
                ))}
            </ul>
        </Sheet>
    );
}
