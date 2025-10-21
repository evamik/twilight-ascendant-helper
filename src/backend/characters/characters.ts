import fs from "fs";
import path from "path";
import { getDataPath } from "../settings/settings";
import { CharacterData, AccountList, CharacterList } from "../types";

const getBasePath = (): string => {
  return getDataPath();
};

/**
 * Check if a folder is a valid character folder by looking for txt files with [Level X] pattern
 * @param folderPath - Full path to the folder to check
 * @returns True if folder contains character save files
 */
const isValidCharacterFolder = (folderPath: string): boolean => {
  try {
    if (!fs.existsSync(folderPath)) {
      return false;
    }

    // Get all .txt files in the folder
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".txt"));

    // Check if any file matches the [Level X] pattern
    const levelPattern = /\[Level\s+\d+\]/i;
    const hasValidFile = files.some((file) => levelPattern.test(file));

    return hasValidFile;
  } catch (error) {
    console.error("Error checking character folder:", error);
    return false;
  }
};

export const getAccountFolders = (): AccountList => {
  try {
    const basePath = getBasePath();

    if (!fs.existsSync(basePath)) {
      console.log("Custom map data directory not found:", basePath);
      return [];
    }

    const items = fs.readdirSync(basePath, { withFileTypes: true });
    const folders = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name);

    console.log("Found account folders:", folders);
    return folders;
  } catch (error) {
    console.error("Error reading account folders:", error);
    return [];
  }
};

export const getCharacterFolders = (accountName: string): CharacterList => {
  try {
    const basePath = getBasePath();
    const accountPath = path.join(basePath, accountName);

    if (!fs.existsSync(accountPath)) {
      console.log("Account directory not found:", accountPath);
      return [];
    }

    const items = fs.readdirSync(accountPath, { withFileTypes: true });

    // Filter to only directories that contain valid character save files
    const folders = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .filter((folderName) => {
        const folderPath = path.join(accountPath, folderName);
        const isValid = isValidCharacterFolder(folderPath);
        if (!isValid) {
          console.log(`Skipping non-character folder: ${folderName}`);
        }
        return isValid;
      });

    console.log("Found valid character folders for", accountName, ":", folders);
    return folders;
  } catch (error) {
    console.error("Error reading character folders:", error);
    return [];
  }
};

export const getLatestCharacterData = (
  accountName: string,
  characterName: string
): CharacterData | null => {
  try {
    const basePath = getBasePath();
    const characterPath = path.join(basePath, accountName, characterName);

    if (!fs.existsSync(characterPath)) {
      console.log("Character directory not found:", characterPath);
      return null;
    }

    // Get all .txt files in the character folder
    const files = fs
      .readdirSync(characterPath)
      .filter((file) => file.endsWith(".txt"))
      .map((file) => ({
        name: file,
        path: path.join(characterPath, file),
        mtime: fs.statSync(path.join(characterPath, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by modified time, newest first

    if (files.length === 0) {
      console.log("No .txt files found for character:", characterName);
      return null;
    }

    const latestFile = files[0];
    const content = fs.readFileSync(latestFile.path, "utf-8");

    console.log("Found latest file for", characterName, ":", latestFile.name);
    return {
      fileName: latestFile.name,
      content: content,
      lastModified: latestFile.mtime,
    };
  } catch (error) {
    console.error("Error reading character data:", error);
    return null;
  }
};
