import { ipcMain } from "electron";
import { getInventoryContent, openInventoryDirectory } from "./inventory";
import { trackFeature } from "../settings/analytics";
import { InventoryResult, OperationResult } from "../types";

/**
 * Register IPC handlers for inventory tracking operations
 */
export const registerInventoryIpcHandlers = (): void => {
  // Get inventory.txt content
  ipcMain.handle(
    "get-inventory",
    async (): Promise<
      InventoryResult & { lastModified?: Date; message?: string }
    > => {
      trackFeature("inventory_viewed", {
        source: "get_inventory",
      });
      return getInventoryContent();
    }
  );

  // Open inventory.txt directory in File Explorer
  ipcMain.handle(
    "open-inventory-directory",
    async (): Promise<OperationResult> => {
      trackFeature("inventory_directory_opened", {
        source: "open_inventory_directory",
      });
      return openInventoryDirectory();
    }
  );
};
