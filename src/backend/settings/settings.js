const fs = require("fs");
const path = require("path");
const os = require("os");
const { app } = require("electron");

// Get the user data path for storing settings
const getSettingsPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "settings.json");
};

// Default settings
const getDefaultSettings = () => ({
  customDataPath: null, // null means use default path
  preloadMessages: [], // Global messages to send before loading character
  postloadMessages: [], // Global messages to send after loading character
  overlayEnabled: false, // Remember if overlay is enabled
  showOnlyT4Classes: false, // Remember T4 class filter state
  characterSettings: {}, // Per-character settings { "accountName:characterName": { preloadMessages, postloadMessages } }
});

// Load settings from file
const loadSettings = () => {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      const settings = JSON.parse(data);
      console.log("Loaded settings:", settings);
      return { ...getDefaultSettings(), ...settings };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return getDefaultSettings();
};

// Save settings to file
const saveSettings = (settings) => {
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
const getDataPath = () => {
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
const setCustomDataPath = (customPath) => {
  const settings = loadSettings();
  settings.customDataPath = customPath;
  return saveSettings(settings);
};

// Reset to default path
const resetToDefaultPath = () => {
  const settings = loadSettings();
  settings.customDataPath = null;
  return saveSettings(settings);
};

// Get loader settings (preload/postload messages)
const getLoaderSettings = () => {
  const settings = loadSettings();
  return {
    preloadMessages: settings.preloadMessages || [],
    postloadMessages: settings.postloadMessages || [],
  };
};

// Set preload messages
const setPreloadMessages = (messages) => {
  const settings = loadSettings();
  settings.preloadMessages = Array.isArray(messages) ? messages : [];
  return saveSettings(settings);
};

// Set postload messages
const setPostloadMessages = (messages) => {
  const settings = loadSettings();
  settings.postloadMessages = Array.isArray(messages) ? messages : [];
  return saveSettings(settings);
};

// Get UI settings (overlay and filter preferences)
const getUISettings = () => {
  const settings = loadSettings();
  return {
    overlayEnabled:
      settings.overlayEnabled !== undefined ? settings.overlayEnabled : false,
    showOnlyT4Classes:
      settings.showOnlyT4Classes !== undefined
        ? settings.showOnlyT4Classes
        : false,
  };
};

// Set overlay enabled state
const setOverlayEnabled = (enabled) => {
  const settings = loadSettings();
  settings.overlayEnabled = Boolean(enabled);
  return saveSettings(settings);
};

// Set show only T4 classes filter state
const setShowOnlyT4Classes = (enabled) => {
  const settings = loadSettings();
  settings.showOnlyT4Classes = Boolean(enabled);
  return saveSettings(settings);
};

module.exports = {
  loadSettings,
  saveSettings,
  getDataPath,
  setCustomDataPath,
  resetToDefaultPath,
  getLoaderSettings,
  setPreloadMessages,
  setPostloadMessages,
  getUISettings,
  setOverlayEnabled,
  setShowOnlyT4Classes,
};
