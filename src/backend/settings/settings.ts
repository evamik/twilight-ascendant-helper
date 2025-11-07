import fs from "fs";
import path from "path";
import os from "os";
import { app } from "electron";
import { CharacterSettings, Position, Size, Tag } from "../types";
import { DEFAULT_TAGS, migrateTagSettings } from "./tagSettings";

// Settings file structure
export interface Settings {
  customDataPath: string | null;
  replayBaseDirectory: string;
  preloadMessages: string[];
  postloadMessages: string[];
  overlayEnabled: boolean;
  showOnlyT4Classes: boolean;
  overlayPosition?: Position; // Saved overlay anchor offset
  overlaySize?: Size; // Saved overlay size
  favoriteCharacters?: string[]; // Array of "accountName:characterName"
  lastUsedAccount?: string; // Last selected account name
  availableTags?: Tag[]; // User-defined tags
  characterTags?: Record<string, string[]>; // Map of "accountName:characterName" to array of tag IDs
  selectedTagFilters?: string[]; // Array of currently selected tag filter IDs
  showFavoritesOnly?: boolean; // Whether favorites filter is active
  mainAppScale?: number; // UI scale for main app (default 1.0 = 100%)
  overlayScale?: number; // UI scale for overlay (default 1.0 = 100%)
  characterListScale?: number; // UI scale for character list grid (default 1.0 = 100%)
  guideZoom?: number; // Zoom level for guide view (default 1.0 = 100%)
  lastGuideUrl?: string; // Last opened guide URL
  characterSettings: Record<string, CharacterSettings>;
  overlayToggleKeybind?: string; // Global keybind to toggle overlay expand/minimize
}

// Get the user data path for storing settings
const getSettingsPath = (): string => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "settings.json");
};

// Default settings
const getDefaultSettings = (): Settings => {
  const documentsPath = path.join(os.homedir(), "Documents");
  const defaultReplayPath = path.join(
    documentsPath,
    "Warcraft III",
    "BattleNet"
  );

  return {
    customDataPath: null, // null means use default path
    replayBaseDirectory: defaultReplayPath, // Base directory for replays (contains account ID folders)
    preloadMessages: [], // Global messages to send before loading character
    postloadMessages: [], // Global messages to send after loading character
    overlayEnabled: false, // Remember if overlay is enabled
    showOnlyT4Classes: false, // Remember T4 class filter state
    availableTags: DEFAULT_TAGS, // Initialize with default tags
    characterTags: {}, // Initialize with empty character tag mappings
    characterSettings: {}, // Per-character settings { "accountName:characterName": { preloadMessages, postloadMessages } }
    overlayToggleKeybind: "Alt+O", // Default keybind to toggle overlay expand/minimize
  };
};

// Migrate old settings data to new format
const migrateSettings = (settings: Partial<Settings>): void => {
  // Migrate tag-related settings
  migrateTagSettings(settings);

  // Add other migration logic here as needed
};

// Load settings from file
export const loadSettings = (): Settings => {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(data) as Partial<Settings>;

      // Run migration
      migrateSettings(settings);

      const mergedSettings = { ...getDefaultSettings(), ...settings };

      // Save migrated settings back
      saveSettings(mergedSettings);

      return mergedSettings;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return getDefaultSettings();
};

// Save settings to file
export const saveSettings = (settings: Settings): boolean => {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
};

// Get the Twilight Ascendant data path (default or custom)
export const getDataPath = (): string => {
  const settings = loadSettings();

  if (settings.customDataPath && fs.existsSync(settings.customDataPath)) {
    console.log("Using custom data path:", settings.customDataPath);
    return settings.customDataPath;
  }

  // Default path
  const documentsPath = path.join(os.homedir(), "Documents");
  const defaultPath = path.join(
    documentsPath,
    "Warcraft III",
    "CustomMapData",
    "Twilight Ascendant"
  );
  return defaultPath;
};

// Set custom data path
export const setCustomDataPath = (customPath: string): boolean => {
  const settings = loadSettings();
  settings.customDataPath = customPath;
  return saveSettings(settings);
};

// Reset to default path
export const resetToDefaultPath = (): boolean => {
  const settings = loadSettings();
  settings.customDataPath = null;
  return saveSettings(settings);
};

// Re-export from feature-specific modules
export * from "./tagSettings";
export * from "./overlaySettings";
export * from "./loaderSettings";
export * from "./replaySettings";
export * from "./uiSettings";
export * from "./keybindSettings";
