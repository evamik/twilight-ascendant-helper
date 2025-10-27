import { app, BrowserWindow } from "electron";
import { createOverlayWindow } from "./src/backend/overlay";
import { createMainWindow } from "./src/backend/main";
import {
  registerIpcHandlers,
  setOverlayWin,
  getOverlayState,
  setLastWarcraftBounds,
} from "./src/backend/ipcHandlers";
import { setupAutoUpdater } from "./src/backend/autoUpdater";
import { setupUpdaterIpcHandlers } from "./src/backend/updaterIpcHandlers";
import {
  initAnalytics,
  shutdownAnalytics,
} from "./src/backend/settings/analytics";
import activeWin from "active-win";
import { WindowInfo } from "./src/backend/types";

// Initialize analytics
initAnalytics();

// Register all IPC handlers
registerIpcHandlers();
setupUpdaterIpcHandlers();

app.whenReady().then(() => {
  const mainWin: BrowserWindow = createMainWindow();
  let overlayWin: BrowserWindow = createOverlayWindow();

  setOverlayWin(overlayWin);

  // Recreate overlay window if it's closed (e.g., Alt+F4)
  overlayWin.on("closed", () => {
    console.log("[Main] Overlay window closed, recreating...");
    overlayWin = createOverlayWindow();
    setOverlayWin(overlayWin);
  });

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
  let isOverlayVisible = false; // Track overlay visibility state

  setInterval(async () => {
    try {
      const state = getOverlayState();
      if (state.isDraggingOverlay) {
        return;
      }
      const winInfo = (await activeWin()) as WindowInfo | undefined;
      const isWarcraft = winInfo && winInfo.title === "Warcraft III";
      const isOverlay = winInfo && winInfo.title === overlayWin.getTitle();

      if (isWarcraft && winInfo.bounds) {
        setLastWarcraftBounds({ x: winInfo.bounds.x, y: winInfo.bounds.y });
        hasSeenWarcraftFocused = true; // Mark that we've seen WC3
      }

      // Only show overlay if enabled AND (Warcraft is focused OR (overlay is focused AND we've previously seen Warcraft))
      const shouldShowOverlay =
        state.overlayEnabled &&
        (isWarcraft || (isOverlay && hasSeenWarcraftFocused));

      if (shouldShowOverlay) {
        if (overlayWin) {
          if (isWarcraft && winInfo.bounds) {
            overlayWin.setBounds({
              x: winInfo.bounds.x + state.anchorOffset.x,
              y: winInfo.bounds.y + state.anchorOffset.y,
              width: state.overlaySize.width,
              height: state.overlaySize.height,
            });
          }
          // Only show/focus if not already visible
          if (!isOverlayVisible) {
            console.log("[Main] Showing and focusing overlay");
            overlayWin.show();
            overlayWin.setAlwaysOnTop(true, "screen-saver");
            isOverlayVisible = true;
          }
          overlayWin.webContents.send("window-info", JSON.stringify(winInfo));
        }
      } else {
        if (overlayWin && isOverlayVisible) {
          console.log("[Main] Hiding overlay");
          overlayWin.hide();
          isOverlayVisible = false;
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
