import type { TGuardianStar } from "./card-types";

/**
 * Game rule values (spec 02 D-4). Sources in spec 02 §6 (TBD-D10, TBD-D11).
 */

/** Number of cards in the game: ids 1 (Blue-eyes White Dragon) to 722 (Magician of Black Chaos). */
export const TOTAL_CARDS = 722;

/**
 * The star each guardian star has the advantage over. Two cycles that never interact:
 * Mars → Jupiter → Saturn → Uranus → Pluto → Neptune → Mars, and Sun → Moon → Venus → Mercury → Sun.
 */
export const GUARDIAN_STAR_ADVANTAGE: Readonly<Record<TGuardianStar, TGuardianStar>> = {
    Mars: "Jupiter",
    Jupiter: "Saturn",
    Saturn: "Uranus",
    Uranus: "Pluto",
    Pluto: "Neptune",
    Neptune: "Mars",
    Sun: "Moon",
    Moon: "Venus",
    Venus: "Mercury",
    Mercury: "Sun",
};

/** In battle, the advantaged card gets +GUARDIAN_STAR_BONUS and the disadvantaged card -GUARDIAN_STAR_BONUS. */
export const GUARDIAN_STAR_BONUS = 500;
