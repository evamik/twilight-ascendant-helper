import { Position, Size } from "../types";
import { loadSettings, saveSettings } from "./settings";

// Set overlay enabled state
export const setOverlayEnabled = (enabled: boolean): boolean => {
  const settings = loadSettings();
  settings.overlayEnabled = Boolean(enabled);
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
