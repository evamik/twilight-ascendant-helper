import fs from "fs";
import path from "path";
import { BrowserWindow } from "electron";
import { getDataPath } from "./settings/settings";
import { getDropsFilePath } from "./drops/drops";

/**
 * File watcher for character save files and drops.txt
 * Notifies frontend when files change so UI can be updated
 */

interface WatchedFile {
  watcher: fs.FSWatcher;
  path: string;
}

const watchedCharacterFiles = new Map<string, WatchedFile>();
let dropsWatcher: fs.FSWatcher | null = null;

/**
 * Watch a specific character file for changes
 */
export function watchCharacterFile(
  accountName: string,
  characterName: string,
  mainWindow: BrowserWindow,
  overlayWindow?: BrowserWindow
): void {
  const key = `${accountName}/${characterName}`;

  // If already watching this character, don't add another watcher
  if (watchedCharacterFiles.has(key)) {
    return;
  }

  try {
    const basePath = getDataPath();
    const characterPath = path.join(basePath, accountName, characterName);

    if (!fs.existsSync(characterPath)) {
      console.log(`[FileWatcher] Character path not found: ${characterPath}`);
      return;
    }

    // Watch the entire character directory for file changes
    const watcher = fs.watch(
      characterPath,
      { persistent: false },
      (_eventType, filename) => {
        if (filename && filename.endsWith(".txt")) {
          console.log(
            `[FileWatcher] Character file changed: ${characterName}/${filename}`
          );

          // Notify both windows that character data changed
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("character-file-changed", {
              accountName,
              characterName,
              filename,
            });
          }

          if (overlayWindow && !overlayWindow.isDestroyed()) {
            overlayWindow.webContents.send("character-file-changed", {
              accountName,
              characterName,
              filename,
            });
          }
        }
      }
    );

    watchedCharacterFiles.set(key, { watcher, path: characterPath });
    console.log(`[FileWatcher] Started watching character: ${key}`);
  } catch (error) {
    console.error(`[FileWatcher] Error watching character ${key}:`, error);
  }
}

/**
 * Stop watching a character file
 */
export function unwatchCharacterFile(
  accountName: string,
  characterName: string
): void {
  const key = `${accountName}/${characterName}`;
  const watched = watchedCharacterFiles.get(key);

  if (watched) {
    watched.watcher.close();
    watchedCharacterFiles.delete(key);
    console.log(`[FileWatcher] Stopped watching character: ${key}`);
  }
}

/**
 * Watch the drops.txt file for changes
 */
export function watchDropsFile(
  mainWindow: BrowserWindow,
  overlayWindow?: BrowserWindow
): void {
  // Close existing watcher if any
  if (dropsWatcher) {
    dropsWatcher.close();
    dropsWatcher = null;
  }

  try {
    const dropsPath = getDropsFilePath();

    if (!dropsPath || !fs.existsSync(dropsPath)) {
      console.log(`[FileWatcher] Drops file not found: ${dropsPath}`);
      return;
    }

    // Watch the drops file
    dropsWatcher = fs.watch(dropsPath, { persistent: false }, (eventType) => {
      if (eventType === "change") {
        console.log(`[FileWatcher] Drops file changed`);

        // Notify both windows that drops data changed
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("drops-file-changed");
        }

        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send("drops-file-changed");
        }
      }
    });

    console.log(`[FileWatcher] Started watching drops file: ${dropsPath}`);
  } catch (error) {
    console.error(`[FileWatcher] Error watching drops file:`, error);
  }
}

/**
 * Stop watching the drops file
 */
export function unwatchDropsFile(): void {
  if (dropsWatcher) {
    dropsWatcher.close();
    dropsWatcher = null;
    console.log(`[FileWatcher] Stopped watching drops file`);
  }
}

/**
 * Stop all file watchers
 */
export function stopAllWatchers(): void {
  // Stop all character watchers
  watchedCharacterFiles.forEach((watched) => {
    watched.watcher.close();
  });
  watchedCharacterFiles.clear();

  // Stop drops watcher
  unwatchDropsFile();

  console.log(`[FileWatcher] Stopped all watchers`);
}
