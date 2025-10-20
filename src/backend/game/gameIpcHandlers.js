const { ipcMain } = require("electron");
const { sendLoadCommand } = require("./gameCommands");
const { trackFeature } = require("../settings/analytics");

/**
 * Register IPC handlers for game interaction operations
 */
const registerGameIpcHandlers = () => {
  // Send load command to Warcraft III
  ipcMain.handle("send-load-command", async (event, characterData) => {
    trackFeature("load_character", {
      source: "send_load_command",
    });
    return sendLoadCommand(characterData);
  });
};

module.exports = {
  registerGameIpcHandlers,
};
