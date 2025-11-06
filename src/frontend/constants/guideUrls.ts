/**
 * Guide URLs Configuration
 * Maps hero class names to their specific guide sheet URLs
 *
 * To add a new hero guide:
 * 1. Add the hero class name (must match exactly as it appears in the game)
 * 2. Add the full Google Sheets URL with the specific gid for that hero's sheet
 */

export interface HeroGuideUrls {
  [heroName: string]: string;
}

export const HERO_GUIDE_URLS: HeroGuideUrls = {
  "Aether Priest":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1872232573#gid=1872232573",
  Archsage:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1090465648#gid=1090465648",
  Avenger:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=331585190#gid=331585190",
  Celestara:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=2008992083#gid=2008992083",
  Champion:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1146009434#gid=1146009434",
  "Dark Arch Templar":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=217915457#gid=217915457",
  Elementalist:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=2145469885#gid=2145469885",
  "Grand Inquisitor":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1154313596#gid=1154313596",
  "Grand Templar":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1942870058#gid=1942870058",
  Hierophant:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1633326989#gid=1633326989",
  "Master Stalker":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1150396153#gid=1150396153",
  "Monster Hunter":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=752267583#gid=752267583",
  "Phantom Assassin":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=320273513#gid=320273513",
  "Professional Witcher":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=2101608988#gid=2101608988",
  Prophetess:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=679423528#gid=679423528",
  "Rune Master":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1193139522#gid=1193139522",
  Sniper:
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1980251379#gid=1980251379",
  "White Wizard":
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=439174313#gid=439174313",
};

/**
 * Get the guide URL for a specific hero
 * @param heroName - The hero class name
 * @returns The guide URL or undefined if not found
 */
export const getHeroGuideUrl = (heroName: string): string | undefined => {
  return HERO_GUIDE_URLS[heroName];
};

/**
 * Check if a hero has a guide URL configured
 * @param heroName - The hero class name
 * @returns True if a guide URL exists for this hero
 */
export const hasHeroGuide = (heroName: string): boolean => {
  return heroName in HERO_GUIDE_URLS;
};
