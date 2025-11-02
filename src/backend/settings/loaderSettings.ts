import { LoaderSettings } from "../types";
import { loadSettings, saveSettings } from "./settings";

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
