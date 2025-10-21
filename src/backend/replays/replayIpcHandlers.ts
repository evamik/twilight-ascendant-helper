import { ipcMain } from "electron";
import { copyReplayToDropsDirectory } from "./replays";
import { trackFeature } from "../settings/analytics";
import { ReplayResult } from "../types";

/**
 * Register IPC handlers for replay operations
 */
export const registerReplayIpcHandlers = (): void => {
  // Copy latest replay to drops directory
  ipcMain.handle(
    "copy-latest-replay",
    async (): Promise<
      ReplayResult & {
        sourcePath?: string;
        filename?: string;
        message?: string;
      }
    > => {
      trackFeature("replay_copied", {
        source: "copy_latest_replay",
      });
      return copyReplayToDropsDirectory();
    }
  );
};
