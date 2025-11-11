import { app, BrowserWindow, globalShortcut } from "electron";
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
import {
  watchDropsFile,
  watchInventoryFile,
  stopAllWatchers,
} from "./src/backend/fileWatcher";
import { getOverlayToggleKeybind } from "./src/backend/settings/keybindSettings";
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

  // Function to attach closed event handler
  const attachClosedHandler = () => {
    overlayWin.on("closed", () => {
      console.log("[Main] Overlay window closed, will be recreated if needed");
    });
  };

  attachClosedHandler();

  // Track whether keybind is currently registered
  let isKeybindRegistered = false;
  let currentKeybind = getOverlayToggleKeybind(); // Cache the keybind
  let isKeybindSettingsOpen = false; // Flag to prevent dynamic registration while configuring

  // Register/unregister keybind based on active window
  const updateKeybindRegistration = (shouldRegister: boolean) => {
    if (shouldRegister && !isKeybindRegistered) {
      // Register the shortcut
      const registered = globalShortcut.register(currentKeybind, () => {
        console.log(
          `[Main] Overlay toggle keybind triggered: ${currentKeybind}`
        );
        if (overlayWin && !overlayWin.isDestroyed()) {
          overlayWin.webContents.send("toggle-overlay-minimize");
        }
      });

      if (registered) {
        isKeybindRegistered = true;
      } else {
        console.warn(`[Main] Failed to register keybind: ${currentKeybind}`);
      }
    } else if (!shouldRegister && isKeybindRegistered) {
      // Unregister the specific shortcut instead of all
      if (globalShortcut.isRegistered(currentKeybind)) {
        globalShortcut.unregister(currentKeybind);
      }
      isKeybindRegistered = false;
    }
  };

  // Listen for keybind changes from settings
  const { ipcMain } = require("electron");

  // Listen for keybind settings page open/close
  ipcMain.on("keybind-settings-opened", () => {
    isKeybindSettingsOpen = true;
    // Keep keybind registered while settings are open (so user can test it)
    // but prevent the 20ms loop from unregistering it if focus changes
  });

  ipcMain.on("keybind-settings-closed", () => {
    isKeybindSettingsOpen = false;
  });

  ipcMain.on("keybind-changed", async () => {
    // Store the old keybind before unregistering
    const oldKeybind = currentKeybind;

    // Unregister old keybind if registered
    if (isKeybindRegistered && globalShortcut.isRegistered(oldKeybind)) {
      globalShortcut.unregister(oldKeybind);
      isKeybindRegistered = false;
      console.log(`[Main] Unregistered old keybind: ${oldKeybind}`);
    }

    // Update cached keybind
    const newKeybind = getOverlayToggleKeybind();
    console.log(`[Main] Keybind changed from ${oldKeybind} to ${newKeybind}`);
    currentKeybind = newKeybind;

    // Check if overlay or our windows are focused
    const winInfo = (await activeWin()) as WindowInfo | undefined;
    const isOverlayFocused = winInfo && winInfo.title === overlayWin.getTitle();
    const isMainWindowFocused =
      winInfo && winInfo.owner?.name === "Twilight Ascendant Helper";

    // Small delay before re-registering to avoid Electron issues
    setTimeout(() => {
      if (isOverlayFocused || isMainWindowFocused) {
        updateKeybindRegistration(true);
        console.log(
          "[Main] Re-registered new keybind immediately (our window focused)"
        );

        // Don't call focus() - it causes the overlay minimize state to desync
        // The focus call was triggering extra IPC events that break the UI state
      }
    }, 100); // 100ms delay
  });

  // Setup auto-updater (only in production)
  if (!process.defaultApp) {
    setupAutoUpdater(mainWin);
  }

  // Start watching drops and inventory files
  watchDropsFile(mainWin, overlayWin);
  watchInventoryFile(mainWin, overlayWin);

  mainWin.on("closed", () => {
    stopAllWatchers();
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
      // Check if main window is destroyed - if so, close overlay and exit
      if (mainWin.isDestroyed()) {
        console.log("[Main] Main window destroyed, closing overlay...");
        if (overlayWin && !overlayWin.isDestroyed()) {
          overlayWin.destroy();
        }
        app.quit();
        return;
      }

      const state = getOverlayState();

      // Check if overlay was destroyed but should be enabled - recreate it
      if (state.overlayEnabled && overlayWin.isDestroyed()) {
        console.log(
          "[Main] Overlay was destroyed but is enabled, recreating..."
        );
        overlayWin = createOverlayWindow();
        setOverlayWin(overlayWin);
        attachClosedHandler();
      }

      if (state.isDraggingOverlay) {
        return;
      }
      const winInfo = (await activeWin()) as WindowInfo | undefined;
      const isWarcraft = winInfo && winInfo.title === "Warcraft III";
      const isOverlay = winInfo && winInfo.title === overlayWin.getTitle();
      const isMainWindow =
        winInfo && winInfo.owner?.name === "Twilight Ascendant Helper";

      // Register keybind only when Warcraft III or our app windows are focused
      // UNLESS keybind settings page is open - then keep it registered regardless
      const shouldHaveKeybind = !!(
        isWarcraft ||
        isOverlay ||
        isMainWindow ||
        isKeybindSettingsOpen
      );
      updateKeybindRegistration(shouldHaveKeybind);

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
            overlayWin.show();
            overlayWin.setAlwaysOnTop(true, "screen-saver");
            isOverlayVisible = true;
          }
          overlayWin.webContents.send("window-info", JSON.stringify(winInfo));
        }
      } else {
        if (overlayWin && isOverlayVisible) {
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

// Cleanup analytics and global shortcuts on app quit
app.on("before-quit", async () => {
  globalShortcut.unregisterAll();
  await shutdownAnalytics();
});
