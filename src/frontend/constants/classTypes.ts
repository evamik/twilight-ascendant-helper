/**
 * List of T4 (Tier 4) class names
 * Based on characters that have hero icon files
 * Used for auto-tagging characters with "T4 Only" tag
 */
export const T4_CLASSES: string[] = [
  "Aether Priest",
  "Archsage",
  "Avenger",
  "Celestara",
  "Champion",
  "Dark Arch Templar",
  "Elementalist",
  "Grand Inquisitor",
  "Grand Templar",
  "Hierophant",
  "Master Stalker",
  "Monster Hunter",
  "Phantom Assassin",
  "Professional Witcher",
  "Prophetess",
  "Rune Master",
  "Sniper",
  "White Wizard",
];

/**
 * Check if a character is T4 tier based on class name
 * @param characterName The full character name (starts with class)
 * @returns true if character is T4, false otherwise
 */
export const isT4Character = (characterName: string): boolean => {
  return T4_CLASSES.some((t4Class) => characterName.startsWith(t4Class));
};
