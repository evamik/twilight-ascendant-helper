// Centralized Electron BrowserWindow options and helpers
const path = require("path");

const getAppOptions = () => ({
  width: 800,
  height: 600,
  title: "TeaHelper",
  icon: path.join(__dirname, "public", "icon.png"), // Place your icon file in public/icon.png
  frame: true, // Keep the default top bar (close, maximize, minimize)
  menuVisible: false, // Set to false to hide the menu bar
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
});

module.exports = { getAppOptions };
