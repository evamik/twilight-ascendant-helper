const { app } = require("electron");
const { createOverlayWindow } = require("./src/backend/overlay");
const { createMainWindow } = require("./src/backend/main");
const {
  registerIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
  setIsDraggingOverlay,
} = require("./src/backend/ipcHandlers");
const { setupAutoUpdater } = require("./src/backend/autoUpdater");
const {
  initAnalytics,
  shutdownAnalytics,
} = require("./src/backend/settings/analytics");
const activeWin = require("active-win");

// Initialize analytics
initAnalytics();

// Register all IPC handlers
registerIpcHandlers();

app.whenReady().then(() => {
  const mainWin = createMainWindow();
  const overlayWin = createOverlayWindow();

  setOverlayWin(overlayWin);

  // Setup auto-updater (only in production)
  if (!process.defaultApp) {
    setupAutoUpdater(mainWin);
  }

  mainWin.on("closed", () => {
    if (overlayWin) {
      overlayWin.close();
    }
    app.quit();
  });

  // Track if we've seen Warcraft III focused at least once
  let hasSeenWarcraftFocused = false;

  setInterval(async () => {
    try {
      const state = getOverlayState();
      if (state.isDraggingOverlay) {
        return;
      }
      const winInfo = await activeWin();
      const isWarcraft = winInfo && winInfo.title === "Warcraft III";
      const isOverlay = winInfo && winInfo.title === overlayWin.getTitle();

      if (isWarcraft && winInfo.bounds) {
        setLastWarcraftBounds({ x: winInfo.bounds.x, y: winInfo.bounds.y });
        hasSeenWarcraftFocused = true; // Mark that we've seen WC3
      }

      // Only show overlay if enabled AND (Warcraft is focused OR (overlay is focused AND we've previously seen Warcraft))
      if (
        state.overlayEnabled &&
        (isWarcraft || (isOverlay && hasSeenWarcraftFocused))
      ) {
        if (overlayWin) {
          if (isWarcraft && winInfo.bounds) {
            overlayWin.setBounds({
              x: winInfo.bounds.x + state.anchorOffset.x,
              y: winInfo.bounds.y + state.anchorOffset.y,
              width: state.overlaySize.width,
              height: state.overlaySize.height,
            });
          }
          overlayWin.show();
          overlayWin.setAlwaysOnTop(true, "screen-saver");
          overlayWin.webContents.send("window-info", JSON.stringify(winInfo));
        }
      } else {
        if (overlayWin) {
          overlayWin.hide();
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, 20);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup analytics on app quit
app.on("before-quit", async () => {
  await shutdownAnalytics();
});
