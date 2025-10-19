const fs = require("fs");
const path = require("path");
const { getDataPath } = require("./settings");

const getBasePath = () => {
  return getDataPath();
};

const getAccountFolders = () => {
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

const getCharacterFolders = (accountName) => {
  try {
    const basePath = getBasePath();
    const accountPath = path.join(basePath, accountName);

    if (!fs.existsSync(accountPath)) {
      console.log("Account directory not found:", accountPath);
      return [];
    }

    const items = fs.readdirSync(accountPath, { withFileTypes: true });
    const folders = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name);

    console.log("Found character folders for", accountName, ":", folders);
    return folders;
  } catch (error) {
    console.error("Error reading character folders:", error);
    return [];
  }
};

const getLatestCharacterData = (accountName, characterName) => {
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
      .sort((a, b) => b.mtime - a.mtime); // Sort by modified time, newest first

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

module.exports = {
  getAccountFolders,
  getCharacterFolders,
  getLatestCharacterData,
};
