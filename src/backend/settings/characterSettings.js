const { loadSettings, saveSettings } = require("./settings");

/**
 * Character-specific settings module
 * Handles all per-character configuration (preload/postload messages, etc.)
 */

/**
 * Get character-specific settings
 * @param {string} accountName - Account name
 * @param {string} characterName - Character name
 * @returns {Object|null} Character settings object or null if not set
 */
const getCharacterSettings = (accountName, characterName) => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;
  const characterSettings = settings.characterSettings || {};
  return characterSettings[key] || null;
};

/**
 * Set character-specific preload messages
 * @param {string} accountName - Account name
 * @param {string} characterName - Character name
 * @param {string[]} messages - Array of preload messages
 * @returns {boolean} Success status
 */
const setCharacterPreloadMessages = (accountName, characterName, messages) => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;

  if (!settings.characterSettings) {
    settings.characterSettings = {};
  }

  if (!settings.characterSettings[key]) {
    settings.characterSettings[key] = {};
  }

  settings.characterSettings[key].preloadMessages = Array.isArray(messages)
    ? messages
    : [];
  return saveSettings(settings);
};

/**
 * Set character-specific postload messages
 * @param {string} accountName - Account name
 * @param {string} characterName - Character name
 * @param {string[]} messages - Array of postload messages
 * @returns {boolean} Success status
 */
const setCharacterPostloadMessages = (accountName, characterName, messages) => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;

  if (!settings.characterSettings) {
    settings.characterSettings = {};
  }

  if (!settings.characterSettings[key]) {
    settings.characterSettings[key] = {};
  }

  settings.characterSettings[key].postloadMessages = Array.isArray(messages)
    ? messages
    : [];
  return saveSettings(settings);
};

/**
 * Clear all character-specific settings for a character
 * Reverts the character to using global settings
 * @param {string} accountName - Account name
 * @param {string} characterName - Character name
 * @returns {boolean} Success status
 */
const clearCharacterSettings = (accountName, characterName) => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;

  if (settings.characterSettings && settings.characterSettings[key]) {
    delete settings.characterSettings[key];
    return saveSettings(settings);
  }

  return true; // Already cleared
};

module.exports = {
  getCharacterSettings,
  setCharacterPreloadMessages,
  setCharacterPostloadMessages,
  clearCharacterSettings,
};
