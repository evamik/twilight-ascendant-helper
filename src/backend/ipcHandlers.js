const { ipcMain, dialog } = require("electron");
const {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
} = require("./characters");
const { sendLoadCommand } = require("./gameCommands");
const {
  getDataPath,
  setCustomDataPath,
  resetToDefaultPath,
  getLoaderSettings,
  setPreloadMessages,
  setPostloadMessages,
} = require("./settings");
const { trackFeature } = require("./analytics");

let overlayWin = null;
let overlayEnabled = false;
let anchorOffset = { x: 0, y: 0 };
let isDraggingOverlay = false;
let lastWarcraftBounds = null;
let overlaySize = { width: 400, height: 200 };

const setOverlayWin = (win) => {
  overlayWin = win;
};

const getOverlayState = () => ({
  overlayWin,
  overlayEnabled,
  anchorOffset,
  isDraggingOverlay,
  lastWarcraftBounds,
  overlaySize,
});

const setLastWarcraftBounds = (bounds) => {
  lastWarcraftBounds = bounds;
};

const setIsDraggingOverlay = (dragging) => {
  isDraggingOverlay = dragging;
};

const setOverlaySize = (size) => {
  overlaySize = size;
};

const registerIpcHandlers = () => {
  // Account and character data
  ipcMain.handle("get-account-folders", async () => {
    return getAccountFolders();
  });

  ipcMain.handle("get-character-folders", async (event, accountName) => {
    return getCharacterFolders(accountName);
  });

  ipcMain.handle(
    "get-character-data",
    async (event, accountName, characterName) => {
      return getLatestCharacterData(accountName, characterName);
    }
  );

  // Game commands
  ipcMain.handle("send-load-command", async (event, characterData) => {
    trackFeature("load_character", {
      source: "send_load_command",
    });
    return sendLoadCommand(characterData);
  });

  // Overlay toggle
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

  // Overlay position
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

  // Warcraft position
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

  // Drag state
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

  // Settings - Get current data path
  ipcMain.handle("get-data-path", async () => {
    return getDataPath();
  });

  // Settings - Choose custom directory
  ipcMain.handle("choose-custom-directory", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Twilight Ascendant Data Folder",
      buttonLabel: "Select Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const success = setCustomDataPath(selectedPath);

      // Track feature usage
      if (success) {
        trackFeature("custom_directory_set");
      }

      // Notify all windows that settings changed
      if (success && overlayWin) {
        overlayWin.webContents.send("settings-changed");
      }

      return { success, path: selectedPath };
    }

    return { success: false, path: null };
  });

  // Settings - Reset to default directory
  ipcMain.handle("reset-to-default-directory", async () => {
    const success = resetToDefaultPath();

    // Track feature usage
    if (success) {
      trackFeature("custom_directory_reset");
    }

    // Notify all windows that settings changed
    if (success && overlayWin) {
      overlayWin.webContents.send("settings-changed");
    }

    return { success, path: getDataPath() };
  });

  // Loader Settings - Get loader settings
  ipcMain.handle("get-loader-settings", async () => {
    return getLoaderSettings();
  });

  // Loader Settings - Set preload messages
  ipcMain.handle("set-preload-messages", async (event, messages) => {
    const success = setPreloadMessages(messages);
    trackFeature("preload_messages_configured", {
      count: messages.length,
    });
    return { success };
  });

  // Loader Settings - Set postload messages
  ipcMain.handle("set-postload-messages", async (event, messages) => {
    const success = setPostloadMessages(messages);
    trackFeature("postload_messages_configured", {
      count: messages.length,
    });
    return { success };
  });
};

module.exports = {
  registerIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
  setIsDraggingOverlay,
  setOverlaySize,
};
