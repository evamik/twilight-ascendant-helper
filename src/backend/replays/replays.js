const fs = require("fs");
const path = require("path");
const { getReplayBaseDirectory } = require("../settings/settings");
const { getDataPath } = require("../settings/settings");

/**
 * Replays Module
 * Finds and copies the latest LastReplay.w3g from BattleNet account folders
 */

/**
 * Find the latest LastReplay.w3g across all account folders
 * @returns {Object} Object with success status and replay path or error
 */
const findLatestReplay = () => {
  try {
    const replayBaseDir = getReplayBaseDirectory();

    if (!fs.existsSync(replayBaseDir)) {
      console.log("Replay base directory not found:", replayBaseDir);
      return {
        success: false,
        error: `Replay directory not found: ${replayBaseDir}`,
      };
    }

    // Get all account folders (e.g., 422357159)
    const accountFolders = fs
      .readdirSync(replayBaseDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    if (accountFolders.length === 0) {
      return {
        success: false,
        error: "No account folders found in replay directory",
      };
    }

    console.log(
      `Found ${accountFolders.length} account folders:`,
      accountFolders
    );

    // Search for LastReplay.w3g in each account's Replays folder
    let latestReplay = null;
    let latestModTime = 0;

    for (const accountFolder of accountFolders) {
      const replayPath = path.join(
        replayBaseDir,
        accountFolder,
        "Replays",
        "LastReplay.w3g"
      );

      if (fs.existsSync(replayPath)) {
        const stats = fs.statSync(replayPath);
        const modTime = stats.mtimeMs;

        console.log(
          `Found replay in ${accountFolder}, modified:`,
          new Date(stats.mtime)
        );

        if (modTime > latestModTime) {
          latestModTime = modTime;
          latestReplay = {
            path: replayPath,
            accountId: accountFolder,
            modifiedTime: stats.mtime,
          };
        }
      }
    }

    if (!latestReplay) {
      return {
        success: false,
        error: "No LastReplay.w3g found in any account folder",
      };
    }

    console.log(`Latest replay found in account ${latestReplay.accountId}`);
    return {
      success: true,
      replayPath: latestReplay.path,
      accountId: latestReplay.accountId,
      modifiedTime: latestReplay.modifiedTime,
    };
  } catch (error) {
    console.error("Error finding latest replay:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Copy the latest LastReplay.w3g to the drops.txt directory
 * @returns {Object} Object with success status, destination path, or error
 */
const copyReplayToDropsDirectory = () => {
  try {
    // Find the latest replay
    const replayResult = findLatestReplay();

    if (!replayResult.success) {
      return replayResult; // Return the error
    }

    const { replayPath, accountId, modifiedTime } = replayResult;

    // Get the drops directory (same as data path)
    const dropsDirectory = getDataPath();

    if (!fs.existsSync(dropsDirectory)) {
      fs.mkdirSync(dropsDirectory, { recursive: true });
      console.log("Created drops directory:", dropsDirectory);
    }

    // Use exact filename (replaces previous copy if it exists)
    const destinationFilename = "LastReplay.w3g";
    const destinationPath = path.join(dropsDirectory, destinationFilename);

    // Copy the file (overwrites if exists)
    fs.copyFileSync(replayPath, destinationPath);
    console.log(`Copied replay to: ${destinationPath}`);

    return {
      success: true,
      sourcePath: replayPath,
      destinationPath: destinationPath,
      accountId: accountId,
      filename: destinationFilename,
      message: `Replay copied successfully: ${destinationFilename}`,
    };
  } catch (error) {
    console.error("Error copying replay:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  findLatestReplay,
  copyReplayToDropsDirectory,
};
