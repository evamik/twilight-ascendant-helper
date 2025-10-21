// Centralized Electron BrowserWindow options and helpers
import path from "path";
import { BrowserWindowConstructorOptions } from "electron";

export const getAppOptions = (): BrowserWindowConstructorOptions => ({
  width: 800,
  height: 600,
  title: "TeaHelper",
  icon: path.join(__dirname, "public", "icon.png"), // Place your icon file in public/icon.png
  frame: true, // Keep the default top bar (close, maximize, minimize)
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
});
