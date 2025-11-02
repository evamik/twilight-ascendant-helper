import { loadSettings, saveSettings } from "./settings";

// Get replay base directory
export const getReplayBaseDirectory = (): string => {
  const settings = loadSettings();
  // loadSettings() already merges with defaults, so replayBaseDirectory will always be set
  return settings.replayBaseDirectory;
};

// Set replay base directory
export const setReplayBaseDirectory = (directory: string): boolean => {
  const settings = loadSettings();
  settings.replayBaseDirectory = directory;
  return saveSettings(settings);
};
