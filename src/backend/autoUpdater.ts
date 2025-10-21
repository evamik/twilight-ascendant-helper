import { autoUpdater } from "electron-updater";
import { dialog, BrowserWindow } from "electron";
import { UpdateInfo, ProgressInfo } from "electron-updater";

// Configure auto updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true; // Install update when app quits

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Check for updates on app start (after 3 seconds to let the app load)
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);

  // When update is available
  autoUpdater.on("update-available", (info: UpdateInfo) => {
    console.log("Update available:", info.version);

    const response = dialog.showMessageBoxSync(mainWindow, {
      type: "info",
      title: "Update Available",
      message: `A new version ${info.version} is available!`,
      detail:
        "Would you like to download it now? The update will be installed when you close the app.",
      buttons: ["Download Update", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.downloadUpdate();

      // Show downloading notification
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-status", "Downloading update...");
      }
    }
  });

  // When no update is available
  autoUpdater.on("update-not-available", () => {
    console.log("No updates available");
  });

  // Download progress
  autoUpdater.on("download-progress", (progressObj: ProgressInfo) => {
    const percent = Math.round(progressObj.percent);
    console.log(`Download progress: ${percent}%`);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-progress", percent);
    }
  });

  // Update downloaded
  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    console.log("Update downloaded:", info.version);

    const response = dialog.showMessageBoxSync(mainWindow, {
      type: "info",
      title: "Update Ready",
      message: "Update downloaded successfully!",
      detail: `Version ${info.version} has been downloaded. The app will update when you close it.\n\nWould you like to restart now?`,
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
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

// Manual check for updates (can be triggered from menu)
export function checkForUpdates(_mainWindow: BrowserWindow): void {
  autoUpdater.checkForUpdates();
}
