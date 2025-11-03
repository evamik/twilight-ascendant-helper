import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from "electron";
import {
  getUISettings,
  setShowOnlyT4Classes,
  setFavoriteCharacters,
  setLastUsedAccount,
  getMainAppScale,
  setMainAppScale,
  getOverlayScale,
  setOverlayScale,
} from "./uiSettings";
import { setOverlayEnabled } from "./overlaySettings";
import { trackFeature } from "./analytics";
import { UISettings, SaveResult } from "../types";

// Reference to overlay window (needed for broadcasting settings changes)
// @ts-ignore - Used by setOverlayWin but not read in this file
let overlayWin: BrowserWindow | null = null;

/**
 * Set the overlay window reference for broadcasting settings changes
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  overlayWin = win;
};

/**
 * Register IPC handlers for UI preference operations
 */
export const registerUIIpcHandlers = (): void => {
  // Get UI settings (overlay enabled, T4 filter)
  ipcMain.handle("get-ui-settings", async (): Promise<UISettings> => {
    return getUISettings();
  });

  // Set overlay enabled state
  ipcMain.handle(
    "set-overlay-enabled",
    async (
      _event: IpcMainInvokeEvent,
      enabled: boolean
    ): Promise<SaveResult> => {
      const success = setOverlayEnabled(enabled);
      trackFeature("overlay_preference_saved", {
        enabled,
      });
      return { success };
    }
  );

  // Set show only T4 classes filter state
  ipcMain.handle(
    "set-show-only-t4",
    async (
      _event: IpcMainInvokeEvent,
      enabled: boolean
    ): Promise<SaveResult> => {
      const success = setShowOnlyT4Classes(enabled);
      trackFeature("t4_filter_preference_saved", {
        enabled,
      });
      return { success };
    }
  );

  // Set favorite characters
  ipcMain.handle(
    "set-favorite-characters",
    async (
      _event: IpcMainInvokeEvent,
      favorites: string[]
    ): Promise<SaveResult> => {
      const success = setFavoriteCharacters(favorites);
      trackFeature("favorite_characters_saved", {
        count: favorites.length,
      });
      return { success };
    }
  );

  // Set last used account
  ipcMain.handle(
    "set-last-used-account",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string
    ): Promise<SaveResult> => {
      const success = setLastUsedAccount(accountName);
      return { success };
    }
  );

  // Get main app UI scale
  ipcMain.handle("get-main-app-scale", async (): Promise<number> => {
    return getMainAppScale();
  });

  // Set main app UI scale
  ipcMain.handle(
    "set-main-app-scale",
    async (_event: IpcMainInvokeEvent, scale: number): Promise<SaveResult> => {
      const success = setMainAppScale(scale);
      trackFeature("main_app_scale_saved", { scale });
      return { success };
    }
  );

  // Get overlay UI scale
  ipcMain.handle("get-overlay-scale", async (): Promise<number> => {
    return getOverlayScale();
  });

  // Set overlay UI scale
  ipcMain.handle(
    "set-overlay-scale",
    async (_event: IpcMainInvokeEvent, scale: number): Promise<SaveResult> => {
      const success = setOverlayScale(scale);
      trackFeature("overlay_scale_saved", { scale });

      // Notify overlay window to apply the new scale
      if (success && overlayWin) {
        overlayWin.webContents.send("overlay-scale-changed", scale);
      }

      return { success };
    }
  );
};
