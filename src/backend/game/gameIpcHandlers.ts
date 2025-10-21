import { ipcMain, IpcMainInvokeEvent } from "electron";
import { sendLoadCommand } from "./gameCommands";
import { trackFeature } from "../settings/analytics";
import { CharacterData, GameSendResult } from "../types";

/**
 * Register IPC handlers for game interaction operations
 */
export const registerGameIpcHandlers = (): void => {
  // Send load command to Warcraft III
  ipcMain.handle(
    "send-load-command",
    async (
      _event: IpcMainInvokeEvent,
      characterData: CharacterData,
      accountName?: string,
      characterName?: string
    ): Promise<GameSendResult> => {
      trackFeature("load_character", {
        source: "send_load_command",
        hasCharacterContext: !!(accountName && characterName),
      });
      return sendLoadCommand(
        characterData,
        accountName || null,
        characterName || null
      );
    }
  );
};
