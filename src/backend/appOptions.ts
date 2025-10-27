// Centralized Electron BrowserWindow options and helpers
import path from "path";
import { BrowserWindowConstructorOptions } from "electron";
import { app } from "electron";

// Get the correct icon path for both dev and production
const getIconPath = () => {
  if (app.isPackaged) {
    // In production, use process.resourcesPath
    return path.join(process.resourcesPath, "build", "icon.ico");
  } else {
    // In development, go up from dist/backend to project root, then to build
    return path.join(__dirname, "..", "..", "build", "icon.ico");
  }
};

export const getAppOptions = (): BrowserWindowConstructorOptions => ({
  width: 800,
  height: 600,
  title: `TeaHelper v${app.getVersion()}`,
  icon: getIconPath(), // Icon path for both dev and production
  frame: true, // Keep the default top bar (close, maximize, minimize)
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  },
});
