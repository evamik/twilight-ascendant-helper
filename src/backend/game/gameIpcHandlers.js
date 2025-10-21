const { ipcMain } = require("electron");
const { sendLoadCommand } = require("./gameCommands");
const { trackFeature } = require("../settings/analytics");

/**
 * Register IPC handlers for game interaction operations
 */
const registerGameIpcHandlers = () => {
  // Send load command to Warcraft III
  ipcMain.handle(
    "send-load-command",
    async (event, characterData, accountName, characterName) => {
      trackFeature("load_character", {
        source: "send_load_command",
        hasCharacterContext: !!(accountName && characterName),
      });
      return sendLoadCommand(characterData, accountName, characterName);
    }
  );
};

module.exports = {
  registerGameIpcHandlers,
};
