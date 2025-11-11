import fs from "fs";
import path from "path";
import { shell } from "electron";
import { getDataPath } from "../settings/settings";
import { InventoryResult, OperationResult } from "../types";

/**
 * Inventory Tracking Module
 * Reads and provides access to the inventory.txt file from the Twilight Ascendant data directory
 * The game updates this file approximately every 0.25s with live inventory and stash data
 */

/**
 * Get the path to the inventory.txt file
 * @returns Full path to inventory.txt
 */
export const getInventoryFilePath = (): string => {
  const dataPath = getDataPath();
  return path.join(dataPath, "inventory.txt");
};

/**
 * Read the inventory.txt file content
 * @returns Object with success status and inventory content or error message
 */
export const getInventoryContent = (): InventoryResult & {
  lastModified?: Date;
  message?: string;
} => {
  try {
    const inventoryPath = getInventoryFilePath();

    if (!fs.existsSync(inventoryPath)) {
      return {
        success: true,
        content: undefined,
        message:
          "No inventory.txt file found. Load a character to track your inventory!",
      };
    }

    const content = fs.readFileSync(inventoryPath, "utf-8");

    return {
      success: true,
      content: content,
      lastModified: fs.statSync(inventoryPath).mtime,
    };
  } catch (error) {
    console.error("Error reading inventory.txt:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Watch the inventory.txt file for changes
 * @param callback - Callback function to call when file changes
 * @returns Watcher instance or null if file doesn't exist
 */
export const watchInventoryFile = (
  callback: () => void
): fs.FSWatcher | null => {
  try {
    const inventoryPath = getInventoryFilePath();

    if (!fs.existsSync(inventoryPath)) {
      return null;
    }

    const watcher = fs.watch(inventoryPath, (eventType) => {
      if (eventType === "change") {
        callback();
      }
    });

    return watcher;
  } catch (error) {
    console.error("Error setting up inventory.txt watcher:", error);
    return null;
  }
};

/**
 * Open the inventory.txt directory in File Explorer
 * If inventory.txt exists, it will be highlighted in the folder
 * @returns Object with success status
 */
export const openInventoryDirectory = (): OperationResult => {
  try {
    const inventoryPath = getInventoryFilePath();
    const dataPath = getDataPath();

    // Check if the file exists
    if (fs.existsSync(inventoryPath)) {
      // Show the file in the folder (highlights it)
      shell.showItemInFolder(inventoryPath);
    } else {
      // File doesn't exist yet, just open the data directory
      shell.openPath(dataPath);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error opening inventory directory:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};
