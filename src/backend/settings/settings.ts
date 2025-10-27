import fs from "fs";
import path from "path";
import os from "os";
import { app } from "electron";
import {
  LoaderSettings,
  UISettings,
  CharacterSettings,
  Position,
  Size,
} from "../types";

// Settings file structure
interface Settings {
  customDataPath: string | null;
  replayBaseDirectory: string;
  preloadMessages: string[];
  postloadMessages: string[];
  overlayEnabled: boolean;
  showOnlyT4Classes: boolean;
  overlayPosition?: Position; // Saved overlay anchor offset
  overlaySize?: Size; // Saved overlay size
  characterSettings: Record<string, CharacterSettings>;
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
    characterSettings: {}, // Per-character settings { "accountName:characterName": { preloadMessages, postloadMessages } }
  };
};

// Load settings from file
export const loadSettings = (): Settings => {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(data) as Partial<Settings>;
      console.log("Loaded settings:", settings);
      return { ...getDefaultSettings(), ...settings };
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
    console.log("Saved settings:", settings);
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
  console.log("Using default data path:", defaultPath);
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

// Get loader settings (preload/postload messages)
export const getLoaderSettings = (): LoaderSettings => {
  const settings = loadSettings();
  return {
    preloadMessages: settings.preloadMessages || [],
    postloadMessages: settings.postloadMessages || [],
  };
};

// Set preload messages
export const setPreloadMessages = (messages: string[]): boolean => {
  const settings = loadSettings();
  settings.preloadMessages = Array.isArray(messages) ? messages : [];
  return saveSettings(settings);
};

// Set postload messages
export const setPostloadMessages = (messages: string[]): boolean => {
  const settings = loadSettings();
  settings.postloadMessages = Array.isArray(messages) ? messages : [];
  return saveSettings(settings);
};

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
  };
};

// Set overlay enabled state
export const setOverlayEnabled = (enabled: boolean): boolean => {
  const settings = loadSettings();
  settings.overlayEnabled = Boolean(enabled);
  return saveSettings(settings);
};

// Set show only T4 classes filter state
export const setShowOnlyT4Classes = (enabled: boolean): boolean => {
  const settings = loadSettings();
  settings.showOnlyT4Classes = Boolean(enabled);
  return saveSettings(settings);
};

// Get replay base directory
export const getReplayBaseDirectory = (): string => {
  const settings = loadSettings();
  return (
    settings.replayBaseDirectory || getDefaultSettings().replayBaseDirectory
  );
};

// Set replay base directory
export const setReplayBaseDirectory = (directory: string): boolean => {
  const settings = loadSettings();
  settings.replayBaseDirectory = directory;
  return saveSettings(settings);
};

// Set overlay position
export const setOverlayPosition = (position: Position): boolean => {
  const settings = loadSettings();
  settings.overlayPosition = position;
  return saveSettings(settings);
};

// Set overlay size
export const setOverlaySize = (size: Size): boolean => {
  const settings = loadSettings();
  settings.overlaySize = size;
  return saveSettings(settings);
};

// Reset overlay position and size to defaults
export const resetOverlayPositionAndSize = (): boolean => {
  const settings = loadSettings();
  settings.overlayPosition = undefined;
  settings.overlaySize = undefined;
  return saveSettings(settings);
};
