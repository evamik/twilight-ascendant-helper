import path from "path";
import os from "os";
import { loadSettings, saveSettings } from "./settings";

// Get replay base directory
export const getReplayBaseDirectory = (): string => {
  const settings = loadSettings();
  // If the directory is empty or not set, return the default
  if (!settings.replayBaseDirectory || settings.replayBaseDirectory.trim() === "") {
    const documentsPath = path.join(os.homedir(), "Documents");
    return path.join(documentsPath, "Warcraft III", "BattleNet");
  }
  return settings.replayBaseDirectory;
};

// Set replay base directory
export const setReplayBaseDirectory = (directory: string): boolean => {
  const settings = loadSettings();
  settings.replayBaseDirectory = directory;
  return saveSettings(settings);
};
