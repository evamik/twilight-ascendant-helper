const { ipcMain } = require("electron");
const { getDropsContent, openDropsDirectory } = require("./drops");
const { trackFeature } = require("../settings/analytics");

/**
 * Register IPC handlers for drops tracking operations
 */
const registerDropsIpcHandlers = () => {
  // Get drops.txt content
  ipcMain.handle("get-drops", async () => {
    trackFeature("drops_viewed", {
      source: "get_drops",
    });
    return getDropsContent();
  });

  // Open drops.txt directory in File Explorer
  ipcMain.handle("open-drops-directory", async () => {
    trackFeature("drops_directory_opened", {
      source: "open_drops_directory",
    });
    return openDropsDirectory();
  });
};

module.exports = {
  registerDropsIpcHandlers,
};
