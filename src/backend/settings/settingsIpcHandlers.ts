import { ipcMain, dialog, BrowserWindow, IpcMainInvokeEvent } from "electron";
import {
  getDataPath,
  setCustomDataPath,
  resetToDefaultPath,
  getLoaderSettings,
  setPreloadMessages,
  setPostloadMessages,
  getUISettings,
  setOverlayEnabled,
  setShowOnlyT4Classes,
  setFavoriteCharacters,
  setLastUsedAccount,
  getReplayBaseDirectory,
  setReplayBaseDirectory,
} from "./settings";
import {
  getCharacterSettings,
  setCharacterPreloadMessages,
  setCharacterPostloadMessages,
  clearCharacterSettings,
} from "./characterSettings";
import { trackFeature } from "./analytics";
import {
  DirectoryResult,
  SaveResult,
  LoaderSettings,
  UISettings,
  CharacterSettings,
} from "../types";

// Reference to overlay window (needed for broadcasting settings changes)
let overlayWin: BrowserWindow | null = null;

/**
 * Set the overlay window reference for broadcasting settings changes
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  overlayWin = win;
};

/**
 * Register IPC handlers for settings operations
 */
export const registerSettingsIpcHandlers = (): void => {
  // Data Directory Settings

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

  // Loader Settings

  // Get loader settings (preload/postload messages)
  ipcMain.handle("get-loader-settings", async (): Promise<LoaderSettings> => {
    return getLoaderSettings();
  });

  // Set preload messages
  ipcMain.handle(
    "set-preload-messages",
    async (
      _event: IpcMainInvokeEvent,
      messages: string[]
    ): Promise<SaveResult> => {
      const success = setPreloadMessages(messages);
      trackFeature("preload_messages_configured", {
        count: messages.length,
      });
      return { success };
    }
  );

  // Set postload messages
  ipcMain.handle(
    "set-postload-messages",
    async (
      _event: IpcMainInvokeEvent,
      messages: string[]
    ): Promise<SaveResult> => {
      const success = setPostloadMessages(messages);
      trackFeature("postload_messages_configured", {
        count: messages.length,
      });
      return { success };
    }
  );

  // UI Settings

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

  // Per-Character Settings

  // Get character-specific settings (preload/postload messages)
  ipcMain.handle(
    "get-character-settings",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ): Promise<{
      characterSettings: CharacterSettings | null;
      globalSettings: LoaderSettings;
    }> => {
      const characterSettings = getCharacterSettings(
        accountName,
        characterName
      );
      const globalSettings = getLoaderSettings();
      return {
        characterSettings, // null if not set
        globalSettings, // fallback global settings
      };
    }
  );

  // Set character-specific preload messages
  ipcMain.handle(
    "set-character-preload",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string,
      messages: string[]
    ): Promise<SaveResult> => {
      const success = setCharacterPreloadMessages(
        accountName,
        characterName,
        messages
      );
      trackFeature("character_preload_messages_configured", {
        accountName,
        characterName,
        count: messages.length,
      });
      return { success };
    }
  );

  // Set character-specific postload messages
  ipcMain.handle(
    "set-character-postload",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string,
      messages: string[]
    ): Promise<SaveResult> => {
      const success = setCharacterPostloadMessages(
        accountName,
        characterName,
        messages
      );
      trackFeature("character_postload_messages_configured", {
        accountName,
        characterName,
        count: messages.length,
      });
      return { success };
    }
  );

  // Clear character-specific settings (revert to global)
  ipcMain.handle(
    "clear-character-settings",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ): Promise<SaveResult> => {
      const success = clearCharacterSettings(accountName, characterName);
      trackFeature("character_settings_cleared", {
        accountName,
        characterName,
      });
      return { success };
    }
  );

  // Replay Directory Settings

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
      // Reset to empty string (which will use default path)
      const success = setReplayBaseDirectory("");

      // Track feature usage
      if (success) {
        trackFeature("replay_directory_reset");
      }

      return { success, path: getReplayBaseDirectory() };
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
