import { UISettings } from "../types";
import { loadSettings, saveSettings } from "./settings";
import { DEFAULT_TAGS } from "./tagSettings";

// Get UI settings (overlay and filter preferences)
export const getUISettings = (): UISettings => {
  const settings = loadSettings();
  return {
    overlayEnabled:
      settings.overlayEnabled !== undefined ? settings.overlayEnabled : false,
    showOnlyT4Classes:
      settings.showOnlyT4Classes !== undefined
        ? settings.showOnlyT4Classes
        : false,
    overlayPosition: settings.overlayPosition, // Return saved position or undefined
    overlaySize: settings.overlaySize, // Return saved size or undefined
    favoriteCharacters: settings.favoriteCharacters || [], // Return favorites or empty array
    lastUsedAccount: settings.lastUsedAccount, // Return last used account or undefined
    availableTags: settings.availableTags || DEFAULT_TAGS, // Return available tags
    characterTags: settings.characterTags || {}, // Return character tag mappings
    overlayToggleKeybind: settings.overlayToggleKeybind || "Alt+O", // Return keybind or default
  };
};

// Set show only T4 classes filter state
export const setShowOnlyT4Classes = (enabled: boolean): boolean => {
  const settings = loadSettings();
  settings.showOnlyT4Classes = Boolean(enabled);
  return saveSettings(settings);
};

// Set favorite characters
export const setFavoriteCharacters = (favorites: string[]): boolean => {
  const settings = loadSettings();
  settings.favoriteCharacters = Array.isArray(favorites) ? favorites : [];
  return saveSettings(settings);
};

// Set last used account
export const setLastUsedAccount = (accountName: string): boolean => {
  const settings = loadSettings();
  settings.lastUsedAccount = accountName;
  return saveSettings(settings);
};

// Get main app UI scale (default 1.0 = 100%)
export const getMainAppScale = (): number => {
  const settings = loadSettings();
  const scale = settings.mainAppScale ?? 1.0;
  // Clamp between 0.5 and 2.0
  return Math.max(0.5, Math.min(2.0, scale));
};

// Set main app UI scale
export const setMainAppScale = (scale: number): boolean => {
  const settings = loadSettings();
  // Clamp between 0.5 and 2.0
  settings.mainAppScale = Math.max(0.5, Math.min(2.0, scale));
  return saveSettings(settings);
};

// Get overlay UI scale (default 1.0 = 100%)
export const getOverlayScale = (): number => {
  const settings = loadSettings();
  const scale = settings.overlayScale ?? 1.0;
  // Clamp between 0.5 and 2.0
  return Math.max(0.5, Math.min(2.0, scale));
};

// Set overlay UI scale
export const setOverlayScale = (scale: number): boolean => {
  const settings = loadSettings();
  // Clamp between 0.5 and 2.0
  settings.overlayScale = Math.max(0.5, Math.min(2.0, scale));
  return saveSettings(settings);
};
