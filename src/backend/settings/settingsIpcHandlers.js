const { ipcMain, dialog } = require("electron");
const {
  getDataPath,
  setCustomDataPath,
  resetToDefaultPath,
  getLoaderSettings,
  setPreloadMessages,
  setPostloadMessages,
  getUISettings,
  setOverlayEnabled,
  setShowOnlyT4Classes,
  getCharacterSettings,
  setCharacterPreloadMessages,
  setCharacterPostloadMessages,
  clearCharacterSettings,
} = require("./settings");
const { trackFeature } = require("./analytics");

// Reference to overlay window (needed for broadcasting settings changes)
let overlayWin = null;

/**
 * Set the overlay window reference for broadcasting settings changes
 */
const setOverlayWin = (win) => {
  overlayWin = win;
};

/**
 * Register IPC handlers for settings operations
 */
const registerSettingsIpcHandlers = () => {
  // Data Directory Settings

  // Get current data path
  ipcMain.handle("get-data-path", async () => {
    return getDataPath();
  });

  // Choose custom directory
  ipcMain.handle("choose-custom-directory", async (event) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select Twilight Ascendant Data Folder",
      buttonLabel: "Select Folder",
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const success = setCustomDataPath(selectedPath);

      // Track feature usage
      if (success) {
        trackFeature("custom_directory_set");
      }

      // Notify all windows that settings changed
      if (success && overlayWin) {
        overlayWin.webContents.send("settings-changed");
      }

      return { success, path: selectedPath };
    }

    return { success: false, path: null };
  });

  // Reset to default directory
  ipcMain.handle("reset-to-default-directory", async () => {
    const success = resetToDefaultPath();

    // Track feature usage
    if (success) {
      trackFeature("custom_directory_reset");
    }

    // Notify all windows that settings changed
    if (success && overlayWin) {
      overlayWin.webContents.send("settings-changed");
    }

    return { success, path: getDataPath() };
  });

  // Loader Settings

  // Get loader settings (preload/postload messages)
  ipcMain.handle("get-loader-settings", async () => {
    return getLoaderSettings();
  });

  // Set preload messages
  ipcMain.handle("set-preload-messages", async (event, messages) => {
    const success = setPreloadMessages(messages);
    trackFeature("preload_messages_configured", {
      count: messages.length,
    });
    return { success };
  });

  // Set postload messages
  ipcMain.handle("set-postload-messages", async (event, messages) => {
    const success = setPostloadMessages(messages);
    trackFeature("postload_messages_configured", {
      count: messages.length,
    });
    return { success };
  });

  // UI Settings

  // Get UI settings (overlay enabled, T4 filter)
  ipcMain.handle("get-ui-settings", async () => {
    return getUISettings();
  });

  // Set overlay enabled state
  ipcMain.handle("set-overlay-enabled", async (event, enabled) => {
    const success = setOverlayEnabled(enabled);
    trackFeature("overlay_preference_saved", {
      enabled,
    });
    return { success };
  });

  // Set show only T4 classes filter state
  ipcMain.handle("set-show-only-t4", async (event, enabled) => {
    const success = setShowOnlyT4Classes(enabled);
    trackFeature("t4_filter_preference_saved", {
      enabled,
    });
    return { success };
  });

  // Per-Character Settings

  // Get character-specific settings (preload/postload messages)
  ipcMain.handle(
    "get-character-settings",
    async (event, accountName, characterName) => {
      const characterSettings = getCharacterSettings(
        accountName,
        characterName
      );
      const globalSettings = getLoaderSettings();
      return {
        characterSettings, // null if not set
        globalSettings, // fallback global settings
      };
    }
  );

  // Set character-specific preload messages
  ipcMain.handle(
    "set-character-preload",
    async (event, accountName, characterName, messages) => {
      const success = setCharacterPreloadMessages(
        accountName,
        characterName,
        messages
      );
      trackFeature("character_preload_messages_configured", {
        accountName,
        characterName,
        count: messages.length,
      });
      return { success };
    }
  );

  // Set character-specific postload messages
  ipcMain.handle(
    "set-character-postload",
    async (event, accountName, characterName, messages) => {
      const success = setCharacterPostloadMessages(
        accountName,
        characterName,
        messages
      );
      trackFeature("character_postload_messages_configured", {
        accountName,
        characterName,
        count: messages.length,
      });
      return { success };
    }
  );

  // Clear character-specific settings (revert to global)
  ipcMain.handle(
    "clear-character-settings",
    async (event, accountName, characterName) => {
      const success = clearCharacterSettings(accountName, characterName);
      trackFeature("character_settings_cleared", {
        accountName,
        characterName,
      });
      return { success };
    }
  );
};

module.exports = {
  registerSettingsIpcHandlers,
  setOverlayWin,
};
