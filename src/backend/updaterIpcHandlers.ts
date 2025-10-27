import { ipcMain } from "electron";
import { checkForUpdates, installUpdateAndRestart } from "./autoUpdater";

export function setupUpdaterIpcHandlers(): void {
  // Manual check for updates (triggered by "Check for Updates" button)
  ipcMain.handle("check-for-updates", async (): Promise<void> => {
    checkForUpdates();
  });

  // Install update and restart (triggered by "Restart to Update" button)
  ipcMain.handle("install-update-and-restart", async (): Promise<void> => {
    installUpdateAndRestart();
  });
}
