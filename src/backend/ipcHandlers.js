/**
 * IPC Handlers Orchestrator
 * Imports and registers all domain-specific IPC handlers
 * Each domain (characters, game, settings, overlay, drops) manages its own IPC handlers
 */

const {
  registerCharacterIpcHandlers,
} = require("./characters/characterIpcHandlers");
const { registerGameIpcHandlers } = require("./game/gameIpcHandlers");
const {
  registerSettingsIpcHandlers,
  setOverlayWin: setSettingsOverlayWin,
} = require("./settings/settingsIpcHandlers");
const {
  registerOverlayIpcHandlers,
  setOverlayWin: setOverlayIpcHandlersWin,
  getOverlayState: getOverlayStateInternal,
  setLastWarcraftBounds: setLastWarcraftBoundsInternal,
  setIsDraggingOverlay: setIsDraggingOverlayInternal,
  setOverlaySize: setOverlaySizeInternal,
} = require("./overlayIpcHandlers");
const { registerDropsIpcHandlers } = require("./drops/dropsIpcHandlers");

/**
 * Set overlay window reference for all handlers that need it
 * Propagates the overlay window to both settings and overlay handlers
 */
const setOverlayWin = (win) => {
  setOverlayIpcHandlersWin(win);
  setSettingsOverlayWin(win);
};

// Re-export other overlay state management functions for use by main.js
const getOverlayState = getOverlayStateInternal;
const setLastWarcraftBounds = setLastWarcraftBoundsInternal;
const setIsDraggingOverlay = setIsDraggingOverlayInternal;
const setOverlaySize = setOverlaySizeInternal;

/**
 * Register all IPC handlers from all domains
 * Called by main.js on app initialization
 */
const registerIpcHandlers = () => {
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
};

module.exports = {
  registerIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
  setIsDraggingOverlay,
  setOverlaySize,
};
