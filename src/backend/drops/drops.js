const fs = require("fs");
const path = require("path");
const { shell } = require("electron");
const { getDataPath } = require("../settings/settings");

/**
 * Drops Tracking Module
 * Reads and provides access to the drops.txt file from the Twilight Ascendant data directory
 */

/**
 * Get the path to the drops.txt file
 * @returns {string} Full path to drops.txt
 */
const getDropsFilePath = () => {
  const dataPath = getDataPath();
  return path.join(dataPath, "drops.txt");
};

/**
 * Read the drops.txt file content
 * @returns {Object} Object with success status and drops content or error message
 */
const getDropsContent = () => {
  try {
    const dropsPath = getDropsFilePath();

    if (!fs.existsSync(dropsPath)) {
      console.log("drops.txt file not found at:", dropsPath);
      return {
        success: true,
        content: null,
        message: "No drops.txt file found. Start playing to track your drops!",
      };
    }

    const content = fs.readFileSync(dropsPath, "utf-8");
    console.log("Successfully read drops.txt");

    return {
      success: true,
      content: content,
      lastModified: fs.statSync(dropsPath).mtime,
    };
  } catch (error) {
    console.error("Error reading drops.txt:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Watch the drops.txt file for changes (optional - for future real-time updates)
 * @param {Function} callback - Callback function to call when file changes
 * @returns {fs.FSWatcher|null} Watcher instance or null if file doesn't exist
 */
const watchDropsFile = (callback) => {
  try {
    const dropsPath = getDropsFilePath();

    if (!fs.existsSync(dropsPath)) {
      console.log("Cannot watch drops.txt - file doesn't exist yet");
      return null;
    }

    const watcher = fs.watch(dropsPath, (eventType) => {
      if (eventType === "change") {
        console.log("drops.txt file changed");
        callback();
      }
    });

    console.log("Started watching drops.txt for changes");
    return watcher;
  } catch (error) {
    console.error("Error setting up drops.txt watcher:", error);
    return null;
  }
};

/**
 * Open the drops.txt directory in File Explorer
 * If drops.txt exists, it will be highlighted in the folder
 * @returns {Object} Object with success status
 */
const openDropsDirectory = () => {
  try {
    const dropsPath = getDropsFilePath();
    const dataPath = getDataPath();

    // Check if the file exists
    if (fs.existsSync(dropsPath)) {
      // Show the file in the folder (highlights it)
      shell.showItemInFolder(dropsPath);
      console.log("Opened drops.txt location in File Explorer");
    } else {
      // File doesn't exist yet, just open the data directory
      shell.openPath(dataPath);
      console.log(
        "Opened data directory in File Explorer (drops.txt not found)"
      );
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error opening drops directory:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  getDropsFilePath,
  getDropsContent,
  watchDropsFile,
  openDropsDirectory,
};
