import fs from "fs";
import path from "path";
import { getReplayBaseDirectory, getDataPath } from "../settings/settings";
import { ReplayResult } from "../types";

/**
 * Replays Module
 * Finds and copies the latest LastReplay.w3g from BattleNet account folders
 */

/**
 * Find the latest LastReplay.w3g across all account folders
 * @returns Object with success status and replay path or error
 */
export const findLatestReplay = (): ReplayResult => {
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

    // Search for LastReplay.w3g in each account's Replays folder
    let latestReplay: {
      path: string;
      accountId: string;
      modifiedTime: Date;
    } | null = null;
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

    return {
      success: true,
      replayPath: latestReplay.path,
      accountId: latestReplay.accountId,
      modifiedTime: latestReplay.modifiedTime.getTime(),
    };
  } catch (error) {
    console.error("Error finding latest replay:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Copy the latest LastReplay.w3g to the drops.txt directory
 * @returns Object with success status, destination path, or error
 */
export const copyReplayToDropsDirectory = (): ReplayResult & {
  sourcePath?: string;
  filename?: string;
  message?: string;
} => {
  try {
    // Find the latest replay
    const replayResult = findLatestReplay();

    if (!replayResult.success) {
      return replayResult; // Return the error
    }

    const { replayPath, accountId } = replayResult;

    if (!replayPath) {
      return {
        success: false,
        error: "Replay path not found",
      };
    }

    // Get the drops directory (same as data path)
    const dropsDirectory = getDataPath();

    if (!fs.existsSync(dropsDirectory)) {
      fs.mkdirSync(dropsDirectory, { recursive: true });
    }

    // Use exact filename (replaces previous copy if it exists)
    const destinationFilename = "LastReplay.w3g";
    const destinationPath = path.join(dropsDirectory, destinationFilename);

    // Copy the file (overwrites if exists)
    fs.copyFileSync(replayPath, destinationPath);

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
      error: (error as Error).message,
    };
  }
};
