import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
} from "./characters";
import { AccountList, CharacterList, CharacterData } from "../types";

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
};
