import { ipcMain, dialog, IpcMainInvokeEvent } from "electron";
import path from "path";
import os from "os";
import {
  getReplayBaseDirectory,
  setReplayBaseDirectory,
} from "./replaySettings";
import { trackFeature } from "./analytics";
import { DirectoryResult, SaveResult } from "../types";

/**
 * Register IPC handlers for replay directory settings operations
 */
export const registerReplayIpcHandlers = (): void => {
  // Get replay base directory
  ipcMain.handle("get-replay-directory", async (): Promise<string> => {
    return getReplayBaseDirectory();
  });

  // Choose replay directory with file dialog
  ipcMain.handle(
    "choose-replay-directory",
    async (_event: IpcMainInvokeEvent): Promise<DirectoryResult> => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select Warcraft III BattleNet Folder",
        buttonLabel: "Select Folder",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        const success = setReplayBaseDirectory(selectedPath);

        // Track feature usage
        if (success) {
          trackFeature("replay_directory_chosen");
        }

        return { success, path: selectedPath };
      }

      return { success: false, path: null };
    }
  );

  // Reset replay directory to default
  ipcMain.handle(
    "reset-replay-directory",
    async (): Promise<DirectoryResult> => {
      // Get the default path
      const documentsPath = path.join(os.homedir(), "Documents");
      const defaultReplayPath = path.join(
        documentsPath,
        "Warcraft III",
        "BattleNet"
      );

      // Reset to default path
      const success = setReplayBaseDirectory(defaultReplayPath);

      // Track feature usage
      if (success) {
        trackFeature("replay_directory_reset");
      }

      return { success, path: defaultReplayPath };
    }
  );

  // Set replay base directory (legacy handler for manual input)
  ipcMain.handle(
    "set-replay-directory",
    async (
      _event: IpcMainInvokeEvent,
      directory: string
    ): Promise<SaveResult> => {
      const success = setReplayBaseDirectory(directory);
      if (success) {
        trackFeature("replay_directory_configured");
      }
      return { success };
    }
  );
};
