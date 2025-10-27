import { BrowserWindow } from "electron";
import path from "path";
import { getAppOptions } from "./appOptions";

export const createMainWindow = (): BrowserWindow => {
  const options = getAppOptions();
  const win = new BrowserWindow(options);

  // Always hide the menu bar
  win.setMenu(null);

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:3000");
  } else {
    // In production, load from dist-react folder
    win.loadFile(path.join(__dirname, "../../dist-react/index.html"));
  }
  return win;
};
