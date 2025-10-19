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

module.exports = {
  loadSettings,
  saveSettings,
  getDataPath,
  setCustomDataPath,
  resetToDefaultPath,
};
