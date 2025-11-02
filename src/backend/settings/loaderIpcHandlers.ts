import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
  getLoaderSettings,
  setPreloadMessages,
  setPostloadMessages,
} from "./loaderSettings";
import { trackFeature } from "./analytics";
import { LoaderSettings, SaveResult } from "../types";

/**
 * Register IPC handlers for loader/message settings operations
 */
export const registerLoaderIpcHandlers = (): void => {
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
};
