import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";
import { UpdateInfo, ProgressInfo } from "electron-updater";

// Configure auto updater
autoUpdater.autoDownload = true; // Auto-download updates in background
autoUpdater.autoInstallOnAppQuit = true; // Install update when app quits

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Check for updates on app start (after 3 seconds to let the app load)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);

  // Check for updates every 15 minutes
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 15 * 60 * 1000); // 15 minutes in milliseconds

  // When update is available
  autoUpdater.on("update-available", (info: UpdateInfo) => {
    console.log("Update available:", info.version);

    // Notify frontend that update is downloading
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-available", {
        version: info.version,
        downloading: true,
      });
    }
  });

  // When no update is available
  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");

    // Notify frontend
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-not-available");
    }
  });

  // Download progress
  autoUpdater.on("download-progress", (progressObj: ProgressInfo) => {
    const percent = Math.round(progressObj.percent);
    console.log(`Download progress: ${percent}%`);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-download-progress", percent);
    }
  });

  // Update downloaded
  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    console.log("Update downloaded:", info.version);

    // Notify frontend that update is ready to install
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-downloaded", {
        version: info.version,
      });
    }
  });

  // Error handling
  autoUpdater.on("error", (error: Error) => {
    console.error("Auto-updater error:", error);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-error", error.message);
    }
  });
}

// Manual check for updates (triggered by button)
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates();
}

// Install update and restart app (triggered by "Restart to Update" button)
export function installUpdateAndRestart(): void {
  autoUpdater.quitAndInstall();
}
