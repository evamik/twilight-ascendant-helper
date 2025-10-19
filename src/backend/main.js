const { BrowserWindow } = require("electron");
const path = require("path");
const { getAppOptions } = require("./appOptions.js");

const createMainWindow = () => {
  const options = getAppOptions();
  const win = new BrowserWindow(options);
  if (options.menuVisible === false) {
    win.setMenu(null);
  }
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:3000");
  } else {
    // In production, load from dist-react folder
    win.loadFile(path.join(__dirname, "../../dist-react/index.html"));
  }
  return win;
};

module.exports = { createMainWindow };
