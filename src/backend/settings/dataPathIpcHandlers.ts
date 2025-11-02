import { ipcMain, dialog, BrowserWindow, IpcMainInvokeEvent } from "electron";
import { getDataPath, setCustomDataPath, resetToDefaultPath } from "./settings";
import { trackFeature } from "./analytics";
import { DirectoryResult } from "../types";

// Reference to overlay window (needed for broadcasting settings changes)
let overlayWin: BrowserWindow | null = null;

/**
 * Set the overlay window reference for broadcasting settings changes
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  overlayWin = win;
};

/**
 * Register IPC handlers for data directory path operations
 */
export const registerDataPathIpcHandlers = (): void => {
  // Get current data path
  ipcMain.handle("get-data-path", async (): Promise<string> => {
    return getDataPath();
  });

  // Choose custom directory
  ipcMain.handle(
    "choose-custom-directory",
    async (_event: IpcMainInvokeEvent): Promise<DirectoryResult> => {
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
    }
  );

  // Reset to default directory
  ipcMain.handle(
    "reset-to-default-directory",
    async (): Promise<DirectoryResult> => {
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
    }
  );
};
