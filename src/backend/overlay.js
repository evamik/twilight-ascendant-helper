const { BrowserWindow } = require("electron");
const path = require("path");

const createOverlayWindow = () => {
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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  overlayWin.setAlwaysOnTop(true, "screen-saver");
  if (process.env.NODE_ENV === "development") {
    overlayWin.loadURL("http://localhost:3000/overlay.html");
  } else {
    // In production, load from dist-react folder
    overlayWin.loadFile(path.join(__dirname, "../../dist-react/overlay.html"));
  }
  overlayWin.hide();
  return overlayWin;
};

module.exports = { createOverlayWindow };
