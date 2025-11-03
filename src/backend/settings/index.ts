import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from "electron";
import { getLoaderSettings } from "./loaderSettings";
import {
  getCharacterSettings,
  setCharacterPreloadMessages,
  setCharacterPostloadMessages,
  clearCharacterSettings,
} from "./characterSettings";
import { trackFeature } from "./analytics";
import { CharacterSettings, LoaderSettings, SaveResult } from "../types";
import { registerTagIpcHandlers } from "./tagIpcHandlers";
import { registerLoaderIpcHandlers } from "./loaderIpcHandlers";
import { registerReplayIpcHandlers } from "./replayIpcHandlers";
import {
  registerUIIpcHandlers,
  setOverlayWin as setUIOverlayWin,
} from "./uiIpcHandlers";
import {
  registerDataPathIpcHandlers,
  setOverlayWin as setDataPathOverlayWin,
} from "./dataPathIpcHandlers";
import { registerKeybindIpcHandlers } from "./keybindIpcHandlers";

/**
 * Set the overlay window reference for broadcasting settings changes
 */
export const setOverlayWin = (win: BrowserWindow | null): void => {
  setUIOverlayWin(win);
  setDataPathOverlayWin(win);
};

/**
 * Register IPC handlers for character-specific settings operations
 */
const registerCharacterIpcHandlers = (): void => {
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
};

/**
 * Register all IPC handlers for settings operations
 */
export const registerSettingsIpcHandlers = (): void => {
  registerDataPathIpcHandlers();
  registerLoaderIpcHandlers();
  registerUIIpcHandlers();
  registerCharacterIpcHandlers();
  registerReplayIpcHandlers();
  registerTagIpcHandlers();
  registerKeybindIpcHandlers();
};
