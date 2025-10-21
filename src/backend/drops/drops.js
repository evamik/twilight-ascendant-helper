const fs = require("fs");
const path = require("path");
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

module.exports = {
  getDropsFilePath,
  getDropsContent,
  watchDropsFile,
};
