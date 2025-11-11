/**
 * IPC Handlers Orchestrator
 * Imports and registers all domain-specific IPC handlers
 * Each domain (characters, game, settings, overlay, drops) manages its own IPC handlers
 */

import { registerCharacterIpcHandlers } from "./characters/characterIpcHandlers";
import { registerGameIpcHandlers } from "./game/gameIpcHandlers";
import {
  registerSettingsIpcHandlers,
  setOverlayWin as setSettingsOverlayWin,
} from "./settings";
import {
  registerOverlayIpcHandlers,
  setOverlayWin as setOverlayIpcHandlersWin,
  getOverlayState as getOverlayStateInternal,
  setLastWarcraftBounds as setLastWarcraftBoundsInternal,
  setIsDraggingOverlay as setIsDraggingOverlayInternal,
  setOverlaySize as setOverlaySizeInternal,
} from "./overlayIpcHandlers";
import { registerDropsIpcHandlers } from "./drops/dropsIpcHandlers";
import { registerInventoryIpcHandlers } from "./inventory/inventoryIpcHandlers";
import { registerReplayIpcHandlers } from "./replays/replayIpcHandlers";
import { BrowserWindow } from "electron";

/**
 * Set overlay window reference for all handlers that need it
 * Propagates the overlay window to both settings and overlay handlers
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  setOverlayIpcHandlersWin(win);
  setSettingsOverlayWin(win);
};

// Re-export other overlay state management functions for use by main.js
export const getOverlayState = getOverlayStateInternal;
export const setLastWarcraftBounds = setLastWarcraftBoundsInternal;
export const setIsDraggingOverlay = setIsDraggingOverlayInternal;
export const setOverlaySize = setOverlaySizeInternal;

/**
 * Register all IPC handlers from all domains
 * Called by main.js on app initialization
 */
export const registerIpcHandlers = (): void => {
  // Register character-related handlers
  registerCharacterIpcHandlers();

  // Register game interaction handlers
  registerGameIpcHandlers();

  // Register settings handlers
  registerSettingsIpcHandlers();

  // Register overlay window handlers
  registerOverlayIpcHandlers();

  // Register drops tracking handlers
  registerDropsIpcHandlers();

  // Register inventory tracking handlers
  registerInventoryIpcHandlers();

  // Register replay handlers
  registerReplayIpcHandlers();
};
