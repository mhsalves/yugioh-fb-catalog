import { useCardParam } from "../urlParams";
import CardDetails from "./CardDetails";

/** The card details panel on pages other than the catalog (spec 10 F-5), opened by `?card=<id>`. */
export default function PageCardDetails() {
    const { cardId, open, close } = useCardParam();
    return <CardDetails cardId={cardId} onSelect={open} onClose={close} />;
}
