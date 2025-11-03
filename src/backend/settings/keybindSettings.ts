import { loadSettings, saveSettings } from "./settings";

/**
 * Get the overlay toggle keybind
 */
export const getOverlayToggleKeybind = (): string => {
  const settings = loadSettings();
  return settings.overlayToggleKeybind || "Alt+O";
};

/**
 * Set the overlay toggle keybind
 */
export const setOverlayToggleKeybind = (keybind: string): boolean => {
  const settings = loadSettings();
  settings.overlayToggleKeybind = keybind;
  return saveSettings(settings);
};
