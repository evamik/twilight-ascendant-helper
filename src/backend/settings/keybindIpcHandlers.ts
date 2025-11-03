import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
  getOverlayToggleKeybind,
  setOverlayToggleKeybind,
} from "./keybindSettings";
import { trackFeature } from "./analytics";
import { SaveResult } from "../types";

/**
 * Register IPC handlers for keybind settings operations
 */
export const registerKeybindIpcHandlers = (): void => {
  // Get overlay toggle keybind
  ipcMain.handle("get-overlay-toggle-keybind", async (): Promise<string> => {
    return getOverlayToggleKeybind();
  });

  // Set overlay toggle keybind
  ipcMain.handle(
    "set-overlay-toggle-keybind",
    async (
      _event: IpcMainInvokeEvent,
      keybind: string
    ): Promise<SaveResult> => {
      const success = setOverlayToggleKeybind(keybind);
      if (success) {
        trackFeature("overlay_toggle_keybind_set", { keybind });
      }
      return { success };
    }
  );
};
