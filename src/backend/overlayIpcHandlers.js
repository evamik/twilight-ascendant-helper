/**
 * IPC handlers for overlay window operations
 * Handles overlay positioning, anchoring, drag state, mouse forwarding, minimize state, and resizing
 */

const { ipcMain } = require("electron");
const { trackFeature } = require("./settings/analytics");
const { getUISettings } = require("./settings/settings");

// Overlay state
let overlayWin = null;
let overlayEnabled = false;
let anchorOffset = { x: 0, y: 0 };
let isDraggingOverlay = false;
let lastWarcraftBounds = null;
let overlaySize = { width: 400, height: 300 };

// Load overlay enabled state from settings on module initialization
const initializeOverlayState = () => {
  try {
    const uiSettings = getUISettings();
    overlayEnabled = uiSettings.overlayEnabled || false;
    console.log(`[Overlay] Initialized overlayEnabled: ${overlayEnabled}`);
  } catch (error) {
    console.error("[Overlay] Error loading initial state:", error);
  }
};

// Initialize state when module loads
initializeOverlayState();

/**
 * Register all overlay-related IPC handlers
 */
const registerOverlayIpcHandlers = () => {
  // Toggle overlay enabled state
  ipcMain.on("toggle-overlay", (event, enabled) => {
    overlayEnabled = enabled;
    trackFeature("toggle_overlay", {
      enabled,
    });
  });

  // Anchor management
  ipcMain.on("anchor-changed", (event, anchor) => {
    anchorOffset = anchor;
    if (overlayWin) {
      overlayWin.webContents.send("set-anchor", anchorOffset);
    }
  });

  // Get overlay position (async)
  ipcMain.handle("get-overlay-position", () => {
    if (overlayWin) {
      const pos = overlayWin.getBounds();
      return { x: pos.x, y: pos.y };
    }
    return { x: 0, y: 0 };
  });

  // Get overlay position synchronously
  ipcMain.on("get-overlay-position-sync", (event) => {
    if (overlayWin) {
      const pos = overlayWin.getBounds();
      event.returnValue = { x: pos.x, y: pos.y };
    } else {
      event.returnValue = { x: 0, y: 0 };
    }
  });

  // Get Warcraft III window position
  ipcMain.handle("get-warcraft-position", async () => {
    if (lastWarcraftBounds) {
      return lastWarcraftBounds;
    }
    if (overlayWin) {
      const pos = overlayWin.getBounds();
      return { x: pos.x, y: pos.y };
    }
    return { x: 0, y: 0 };
  });

  // Move overlay (relative delta)
  ipcMain.on("move-overlay", (event, delta) => {
    if (
      overlayWin &&
      delta &&
      typeof delta.dx === "number" &&
      typeof delta.dy === "number"
    ) {
      const bounds = overlayWin.getBounds();
      const newX = bounds.x + delta.dx;
      const newY = bounds.y + delta.dy;
      overlayWin.setBounds({
        x: newX,
        y: newY,
        width: bounds.width,
        height: bounds.height,
      });
    }
  });

  // Set overlay position (absolute)
  ipcMain.on("set-overlay-position", (event, position) => {
    if (
      overlayWin &&
      position &&
      typeof position.x === "number" &&
      typeof position.y === "number"
    ) {
      const bounds = overlayWin.getBounds();
      overlayWin.setBounds({
        x: position.x,
        y: position.y,
        width: bounds.width,
        height: bounds.height,
      });
    }
  });

  // Set drag state
  ipcMain.on("drag-overlay", (event, dragging) => {
    isDraggingOverlay = dragging;
  });

  // Set mouse event forwarding (for minimized overlay)
  ipcMain.on("set-mouse-forward", (event, shouldForward) => {
    if (overlayWin) {
      if (shouldForward) {
        // Forward mouse events through the window (minimized state)
        overlayWin.setIgnoreMouseEvents(true, { forward: true });
      } else {
        // Stop forwarding, capture events normally
        overlayWin.setIgnoreMouseEvents(false);
      }
    }
  });

  // Set overlay minimized state
  ipcMain.on("set-overlay-minimized", (event, isMinimized) => {
    if (overlayWin) {
      if (isMinimized) {
        // When minimized: forward mouse events through
        overlayWin.setIgnoreMouseEvents(true, { forward: true });
        trackFeature("overlay_minimized");
      } else {
        // When expanded: capture mouse events normally
        overlayWin.setIgnoreMouseEvents(false);
        trackFeature("overlay_maximized");
      }
    }
  });

  // Resize overlay
  ipcMain.on("resize-overlay", (event, size) => {
    if (
      overlayWin &&
      size &&
      typeof size.width === "number" &&
      typeof size.height === "number"
    ) {
      overlaySize = {
        width: Math.max(200, size.width),
        height: Math.max(100, size.height),
      };

      const bounds = overlayWin.getBounds();
      overlayWin.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: overlaySize.width,
        height: overlaySize.height,
      });

      overlayWin.webContents.send("set-overlay-size", overlaySize);
    }
  });
};

/**
 * Set the overlay window reference
 * Called from main.js when overlay window is created
 */
const setOverlayWin = (win) => {
  overlayWin = win;
};

/**
 * Get current overlay state
 * Used by main.js for overlay positioning logic
 */
const getOverlayState = () => ({
  overlayEnabled,
  anchorOffset,
  isDraggingOverlay,
  overlaySize,
});

/**
 * Set last known Warcraft III window bounds
 * Used by main.js for overlay repositioning
 */
const setLastWarcraftBounds = (bounds) => {
  lastWarcraftBounds = bounds;
};

/**
 * Set overlay drag state
 * Used by main.js for overlay positioning logic
 */
const setIsDraggingOverlay = (dragging) => {
  isDraggingOverlay = dragging;
};

/**
 * Set overlay size
 * Used by main.js for overlay resizing
 */
const setOverlaySize = (size) => {
  overlaySize = size;
};

module.exports = {
  registerOverlayIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
  setIsDraggingOverlay,
  setOverlaySize,
};
