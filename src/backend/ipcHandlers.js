const { ipcMain } = require("electron");
const {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
} = require("./characters");
const { sendLoadCommand } = require("./gameCommands");

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
    return sendLoadCommand(characterData);
  });

  // Overlay toggle
  ipcMain.on("toggle-overlay", (event, enabled) => {
    overlayEnabled = enabled;
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

  // Move overlay
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

  // Drag state
  ipcMain.on("drag-overlay", (event, dragging) => {
    isDraggingOverlay = dragging;
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

module.exports = {
  registerIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
  setIsDraggingOverlay,
  setOverlaySize,
};
