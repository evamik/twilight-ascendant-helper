import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from "electron";
import {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
  getCharacterSummaries,
} from "./characters";
import {
  AccountList,
  CharacterList,
  CharacterData,
  CharacterSummaryList,
} from "../types";
import { watchCharacterFile, unwatchCharacterFile } from "../fileWatcher";

/**
 * Register IPC handlers for character-related operations
 */
export const registerCharacterIpcHandlers = (): void => {
  // Get list of account folders
  ipcMain.handle("get-account-folders", async (): Promise<AccountList> => {
    return getAccountFolders();
  });

  // Get list of character folders for a specific account
  ipcMain.handle(
    "get-character-folders",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string
    ): Promise<CharacterList> => {
      return getCharacterFolders(accountName);
    }
  );

  // Get character data (latest save file)
  ipcMain.handle(
    "get-character-data",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ): Promise<CharacterData | null> => {
      return getLatestCharacterData(accountName, characterName);
    }
  );

  // Get character summaries (name, level, power shards) for all characters
  ipcMain.handle(
    "get-character-summaries",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string
    ): Promise<CharacterSummaryList> => {
      return getCharacterSummaries(accountName);
    }
  );

  // Start watching a character file
  ipcMain.handle(
    "watch-character-file",
    async (
      event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ): Promise<void> => {
      const mainWindow = BrowserWindow.fromWebContents(event.sender);
      if (mainWindow) {
        const allWindows = BrowserWindow.getAllWindows();
        const overlayWindow = allWindows.find(
          (win) => win !== mainWindow && win.getTitle().includes("Overlay")
        );
        watchCharacterFile(
          accountName,
          characterName,
          mainWindow,
          overlayWindow
        );
      }
    }
  );

  // Stop watching a character file
  ipcMain.handle(
    "unwatch-character-file",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ): Promise<void> => {
      unwatchCharacterFile(accountName, characterName);
    }
  );
};
