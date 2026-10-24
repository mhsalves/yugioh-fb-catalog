import type { TGuardianStar } from "./card-types";
import { rules } from "./catalog.generated";

/**
 * Game rule values (spec 02 D-4), stored in catalog/data/rules.json. Sources in spec 02 §6 (TBD-D10, TBD-D11).
 */
export interface IGameRules {
    totalCards: number;
    /** The star each guardian star has the advantage over. */
    guardianStarAdvantage: Record<TGuardianStar, TGuardianStar>;
    guardianStarBonus: number;
    /** What the weights of every deck and drop pool add up to. */
    poolWeightTotal: number;
}

/** Number of cards in the game: ids 1 (Blue-eyes White Dragon) to 722 (Magician of Black Chaos). */
export const TOTAL_CARDS: number = rules.totalCards;

/**
 * The star each guardian star has the advantage over. Two cycles that never interact:
 * Mars → Jupiter → Saturn → Uranus → Pluto → Neptune → Mars, and Sun → Moon → Venus → Mercury → Sun.
 */
export const GUARDIAN_STAR_ADVANTAGE: Readonly<Record<TGuardianStar, TGuardianStar>> = rules.guardianStarAdvantage;

/** In battle, the advantaged card gets +GUARDIAN_STAR_BONUS and the disadvantaged card -GUARDIAN_STAR_BONUS. */
export const GUARDIAN_STAR_BONUS: number = rules.guardianStarBonus;

/**
 * Every deck and drop pool's weights add up to 2048: the game rolls 1-2048 and walks the pool, so a card's
 * chance is its weight / POOL_WEIGHT_TOTAL.
 */
export const POOL_WEIGHT_TOTAL: number = rules.poolWeightTotal;
