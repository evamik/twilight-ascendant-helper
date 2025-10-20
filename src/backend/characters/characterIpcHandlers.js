const { ipcMain } = require("electron");
const {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
} = require("./characters");

/**
 * Register IPC handlers for character-related operations
 */
const registerCharacterIpcHandlers = () => {
  // Get list of account folders
  ipcMain.handle("get-account-folders", async () => {
    return getAccountFolders();
  });

  // Get list of character folders for a specific account
  ipcMain.handle("get-character-folders", async (event, accountName) => {
    return getCharacterFolders(accountName);
  });

  // Get character data (latest save file)
  ipcMain.handle(
    "get-character-data",
    async (event, accountName, characterName) => {
      return getLatestCharacterData(accountName, characterName);
    }
  );
};

module.exports = {
  registerCharacterIpcHandlers,
};
