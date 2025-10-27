/**
 * IPC handlers for overlay window operations
 * Handles overlay positioning, anchoring, drag state, mouse forwarding, minimize state, and resizing
 */

import { ipcMain, BrowserWindow, IpcMainEvent } from "electron";
import { trackFeature } from "./settings/analytics";
import {
  getUISettings,
  setOverlayPosition as saveOverlayPosition,
  setOverlaySize as saveOverlaySize,
  resetOverlayPositionAndSize,
} from "./settings/settings";
import { Position, Size, OverlayState } from "./types";

// Overlay state
let overlayWin: BrowserWindow | null = null;
let overlayEnabled = false;
let anchorOffset: Position = { x: 0, y: 0 };
let isDraggingOverlay = false;
let lastWarcraftBounds: Position | null = null;
let overlaySize: Size = { width: 400, height: 300 };

// Load overlay enabled state from settings on module initialization
const initializeOverlayState = (): void => {
  try {
    const uiSettings = getUISettings();
    overlayEnabled = uiSettings.overlayEnabled || false;

    // Load saved position and size if available
    if (uiSettings.overlayPosition) {
      anchorOffset = uiSettings.overlayPosition;
      console.log(
        `[Overlay] Loaded saved position: ${JSON.stringify(anchorOffset)}`
      );
    }

    if (uiSettings.overlaySize) {
      overlaySize = uiSettings.overlaySize;
      console.log(
        `[Overlay] Loaded saved size: ${JSON.stringify(overlaySize)}`
      );
    }

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
export const registerOverlayIpcHandlers = (): void => {
  // Toggle overlay enabled state
  ipcMain.on("toggle-overlay", (_event: IpcMainEvent, enabled: boolean) => {
    overlayEnabled = enabled;
    trackFeature("toggle_overlay", {
      enabled,
    });
  });

  // Anchor management
  ipcMain.on("anchor-changed", (_event: IpcMainEvent, anchor: Position) => {
    anchorOffset = anchor;
    if (overlayWin) {
      overlayWin.webContents.send("set-anchor", anchorOffset);
    }
    // Save position to settings
    saveOverlayPosition(anchor);
  });

  // Get overlay position (async)
  ipcMain.handle("get-overlay-position", (): Position => {
    if (overlayWin) {
      const pos = overlayWin.getBounds();
      return { x: pos.x, y: pos.y };
    }
    return { x: 0, y: 0 };
  });

  // Get overlay position synchronously
  ipcMain.on("get-overlay-position-sync", (event: IpcMainEvent) => {
    if (overlayWin) {
      const pos = overlayWin.getBounds();
      event.returnValue = { x: pos.x, y: pos.y };
    } else {
      event.returnValue = { x: 0, y: 0 };
    }
  });

  // Get Warcraft III window position
  ipcMain.handle("get-warcraft-position", async (): Promise<Position> => {
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
  ipcMain.on(
    "move-overlay",
    (_event: IpcMainEvent, delta: { dx: number; dy: number }) => {
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
    }
  );

  // Set overlay position (absolute)
  ipcMain.on(
    "set-overlay-position",
    (_event: IpcMainEvent, position: Position) => {
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
    }
  );

  // Set drag state
  ipcMain.on("drag-overlay", (_event: IpcMainEvent, dragging: boolean) => {
    isDraggingOverlay = dragging;
  });

  // Set mouse event forwarding (for minimized overlay)
  ipcMain.on(
    "set-mouse-forward",
    (_event: IpcMainEvent, shouldForward: boolean) => {
      if (overlayWin) {
        if (shouldForward) {
          // Forward mouse events through the window (minimized state)
          overlayWin.setIgnoreMouseEvents(true, { forward: true });
        } else {
          // Stop forwarding, capture events normally
          overlayWin.setIgnoreMouseEvents(false);
        }
      }
    }
  );

  // Set overlay minimized state
  ipcMain.on(
    "set-overlay-minimized",
    (_event: IpcMainEvent, isMinimized: boolean) => {
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
    }
  );

  // Resize overlay
  ipcMain.on("resize-overlay", (_event: IpcMainEvent, size: Size) => {
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

      // Save size to settings
      saveOverlaySize(overlaySize);
    }
  });

  // Reset overlay position and size to defaults
  ipcMain.handle("reset-overlay-position-size", async (): Promise<boolean> => {
    try {
      // Reset in-memory state to defaults
      anchorOffset = { x: 0, y: 0 };
      overlaySize = { width: 400, height: 300 };

      // Reset saved settings
      const success = resetOverlayPositionAndSize();

      if (success && overlayWin) {
        // Update overlay window immediately
        overlayWin.webContents.send("set-anchor", anchorOffset);
        overlayWin.webContents.send("set-overlay-size", overlaySize);

        const bounds = overlayWin.getBounds();
        overlayWin.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: overlaySize.width,
          height: overlaySize.height,
        });
      }

      trackFeature("reset_overlay_position_size", { success });
      return success;
    } catch (error) {
      console.error("[Overlay] Error resetting position/size:", error);
      trackFeature("reset_overlay_position_size", { success: false, error });
      return false;
    }
  });
};

/**
 * Set the overlay window reference
 * Called from main.js when overlay window is created
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  overlayWin = win;
};

/**
 * Get current overlay state
 * Used by main.js for overlay positioning logic
 */
export const getOverlayState = (): OverlayState & {
  anchorOffset: Position;
  overlaySize: Size;
} => ({
  overlayEnabled,
  anchorOffset,
  isDraggingOverlay,
  overlaySize,
});

/**
 * Set last known Warcraft III window bounds
 * Used by main.js for overlay repositioning
 */
export const setLastWarcraftBounds = (bounds: Position | null): void => {
  lastWarcraftBounds = bounds;
};

/**
 * Set overlay drag state
 * Used by main.js for overlay positioning logic
 */
export const setIsDraggingOverlay = (dragging: boolean): void => {
  isDraggingOverlay = dragging;
};

/**
 * Set overlay size
 * Used by main.js for overlay resizing
 */
export const setOverlaySize = (size: Size): void => {
  overlaySize = size;
};
