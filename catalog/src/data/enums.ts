/**
 * Game enumerations (spec 02 D-4). The TS types in ./card-types are derived from these lists,
 * so the runtime values (for filters) and the types cannot drift apart.
 * Order and spelling follow the game's own type and star tables (sources in spec 02 §6).
 */

/** The 20 monster types, in the game's type-id order (0-19). */
export const MONSTER_TYPES = [
    "Dragon",
    "Spellcaster",
    "Zombie",
    "Warrior",
    "Beast-Warrior",
    "Beast",
    "Winged Beast",
    "Fiend",
    "Fairy",
    "Insect",
    "Dinosaur",
    "Reptile",
    "Fish",
    "Sea Serpent",
    "Machine",
    "Thunder",
    "Aqua",
    "Pyro",
    "Rock",
    "Plant",
] as const;

/** Card types: every monster type is "Monster"; the game's other labels follow in its order (20-23). */
export const CARD_TYPES = ["Monster", "Magic", "Trap", "Ritual", "Equip"] as const;

/** The 10 guardian stars, in the game's star-id order (1-10). */
export const GUARDIAN_STARS = [
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Pluto",
    "Neptune",
    "Mercury",
    "Sun",
    "Moon",
    "Venus",
] as const;
