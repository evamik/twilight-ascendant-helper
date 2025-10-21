import { ipcMain } from "electron";
import { getDropsContent, openDropsDirectory } from "./drops";
import { trackFeature } from "../settings/analytics";
import { DropsResult, OperationResult } from "../types";

/**
 * Register IPC handlers for drops tracking operations
 */
export const registerDropsIpcHandlers = (): void => {
  // Get drops.txt content
  ipcMain.handle(
    "get-drops",
    async (): Promise<
      DropsResult & { lastModified?: Date; message?: string }
    > => {
      trackFeature("drops_viewed", {
        source: "get_drops",
      });
      return getDropsContent();
    }
  );

  // Open drops.txt directory in File Explorer
  ipcMain.handle("open-drops-directory", async (): Promise<OperationResult> => {
    trackFeature("drops_directory_opened", {
      source: "open_drops_directory",
    });
    return openDropsDirectory();
  });
};
