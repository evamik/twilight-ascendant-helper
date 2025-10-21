const { ipcMain } = require("electron");
const { copyReplayToDropsDirectory } = require("./replays");
const { trackFeature } = require("../settings/analytics");

/**
 * Register IPC handlers for replay operations
 */
const registerReplayIpcHandlers = () => {
  // Copy latest replay to drops directory
  ipcMain.handle("copy-latest-replay", async () => {
    trackFeature("replay_copied", {
      source: "copy_latest_replay",
    });
    return copyReplayToDropsDirectory();
  });
};

module.exports = {
  registerReplayIpcHandlers,
};
