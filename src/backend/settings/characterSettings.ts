import { loadSettings, saveSettings } from "./settings";
import { CharacterSettings } from "../types";

/**
 * Character-specific settings module
 * Handles all per-character configuration (preload/postload messages, etc.)
 */

/**
 * Get character-specific settings
 * @param accountName - Account name
 * @param characterName - Character name
 * @returns Character settings object or null if not set
 */
export const getCharacterSettings = (
  accountName: string,
  characterName: string
): CharacterSettings | null => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;
  const characterSettings = settings.characterSettings || {};
  return characterSettings[key] || null;
};

/**
 * Set character-specific preload messages
 * @param accountName - Account name
 * @param characterName - Character name
 * @param messages - Array of preload messages
 * @returns Success status
 */
export const setCharacterPreloadMessages = (
  accountName: string,
  characterName: string,
  messages: string[]
): boolean => {
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
 * @param accountName - Account name
 * @param characterName - Character name
 * @param messages - Array of postload messages
 * @returns Success status
 */
export const setCharacterPostloadMessages = (
  accountName: string,
  characterName: string,
  messages: string[]
): boolean => {
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
 * @param accountName - Account name
 * @param characterName - Character name
 * @returns Success status
 */
export const clearCharacterSettings = (
  accountName: string,
  characterName: string
): boolean => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;

  if (settings.characterSettings && settings.characterSettings[key]) {
    delete settings.characterSettings[key];
    return saveSettings(settings);
  }

  return true; // Already cleared
};
