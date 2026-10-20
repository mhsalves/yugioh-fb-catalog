import rituals from "../data/rituals";
import type { CardId } from "../data/card-types";

/** Recipe for a ritual, looked up by the ritual card's id or by the id of the monster it summons. */
export const getRitual = (ritualOrResultId: CardId) =>
    rituals.find((ritual) => ritual.ritual === ritualOrResultId || ritual.result === ritualOrResultId);
