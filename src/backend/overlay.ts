import { BrowserWindow } from "electron";
import path from "path";

export const createOverlayWindow = (): BrowserWindow => {
  const overlayWin = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false, // Don't show on creation
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  overlayWin.setAlwaysOnTop(true, "screen-saver");
  if (process.env.NODE_ENV === "development") {
    overlayWin.loadURL("http://localhost:3000/overlay.html");
    // Open DevTools for overlay in development to see console logs
    overlayWin.webContents.openDevTools({ mode: "detach" });
  } else {
    // In production, load from dist-react folder
    overlayWin.loadFile(path.join(__dirname, "../../dist-react/overlay.html"));
  }
  // Explicitly hide after creation
  overlayWin.hide();
  return overlayWin;
};
