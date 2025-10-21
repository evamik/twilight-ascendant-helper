const { ipcMain } = require("electron");
const { getDropsContent } = require("./drops");
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
};

module.exports = {
  registerDropsIpcHandlers,
};
