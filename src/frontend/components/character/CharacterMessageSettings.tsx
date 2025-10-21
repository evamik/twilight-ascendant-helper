import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./CharacterMessageSettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface CharacterSettings {
  preloadMessages?: string[];
  postloadMessages?: string[];
}

interface GlobalSettings {
  preloadMessages?: string[];
  postloadMessages?: string[];
}

interface GetSettingsResult {
  characterSettings: CharacterSettings | null;
  globalSettings: GlobalSettings;
}

interface SaveResult {
  success: boolean;
}

/**
 * CharacterMessageSettings Component
 * Handles per-character preload/postload message configuration
 * Shows collapsible settings section with save, clear, and use global actions
 */
interface CharacterMessageSettingsProps {
  accountName: string;
  characterName: string;
}

const CharacterMessageSettings: React.FC<CharacterMessageSettingsProps> = ({
  accountName,
  characterName,
}) => {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [preloadText, setPreloadText] = useState<string>("");
  const [postloadText, setPostloadText] = useState<string>("");
  const [globalPreload, setGlobalPreload] = useState<string[]>([]);
  const [globalPostload, setGlobalPostload] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [hasCharacterSettings, setHasCharacterSettings] =
    useState<boolean>(false);

  // Load character settings on mount or when character changes
  useEffect(() => {
    if (ipcRenderer && accountName && characterName) {
      loadCharacterSettings();
    }
  }, [accountName, characterName]);

  const loadCharacterSettings = async () => {
    if (!ipcRenderer) return;

    try {
      const result = (await ipcRenderer.invoke(
        "get-character-settings",
        accountName,
        characterName
      )) as GetSettingsResult;
      const { characterSettings, globalSettings } = result;

      // Store global settings for reference
      setGlobalPreload(globalSettings.preloadMessages || []);
      setGlobalPostload(globalSettings.postloadMessages || []);

      if (characterSettings) {
        // Character has custom settings
        setHasCharacterSettings(true);
        setPreloadText((characterSettings.preloadMessages || []).join("\n"));
        setPostloadText((characterSettings.postloadMessages || []).join("\n"));
      } else {
        // No custom settings, show empty (will use global)
        setHasCharacterSettings(false);
        setPreloadText("");
        setPostloadText("");
      }
    } catch (error) {
      console.error("Error loading character settings:", error);
    }
  };

  const handleSavePreload = async () => {
    if (!ipcRenderer) return;

    const messages = preloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = (await ipcRenderer.invoke(
      "set-character-preload",
      accountName,
      characterName,
      messages
    )) as SaveResult;
    if (result.success) {
      setHasCharacterSettings(true);
      setSaveStatus("Preload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleSavePostload = async () => {
    if (!ipcRenderer) return;

    const messages = postloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = (await ipcRenderer.invoke(
      "set-character-postload",
      accountName,
      characterName,
      messages
    )) as SaveResult;
    if (result.success) {
      setHasCharacterSettings(true);
      setSaveStatus("Postload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleClear = async () => {
    if (!ipcRenderer) return;

    const result = (await ipcRenderer.invoke(
      "clear-character-settings",
      accountName,
      characterName
    )) as SaveResult;
    if (result.success) {
      setHasCharacterSettings(false);
      setPreloadText("");
      setPostloadText("");
      setSaveStatus("Settings cleared! Using global settings.");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleUseGlobal = () => {
    setPreloadText(globalPreload.join("\n"));
    setPostloadText(globalPostload.join("\n"));
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={styles.toggleButton}
      >
        <span>⚙️ Preload/Postload Messages</span>
        <span>{showSettings ? "▼" : "▶"}</span>
      </button>

      {showSettings && (
        <div className={styles.settingsContent}>
          <div className={styles.statusInfo}>
            {hasCharacterSettings ? (
              <span className={styles.statusActive}>
                ✓ Using custom settings for this character
              </span>
            ) : (
              <span>
                Using global settings. Set custom messages below to override.
              </span>
            )}
          </div>

          {/* Preload Messages */}
          <div className={styles.section}>
            <label className={styles.label}>Preload Messages</label>
            <div className={styles.helpText}>
              Sent <strong>before</strong> loading. One per line.
              {globalPreload.length > 0 && !hasCharacterSettings && (
                <span className={styles.globalInfo}>
                  Global: {globalPreload.join(", ")}
                </span>
              )}
            </div>
            <textarea
              value={preloadText}
              onChange={(e) => setPreloadText(e.target.value)}
              placeholder="Enter custom preload messages&#10;Leave empty to use global settings"
              className={styles.textarea}
            />
            <button onClick={handleSavePreload} className={styles.saveButton}>
              Save Preload
            </button>
          </div>

          {/* Postload Messages */}
          <div className={styles.section}>
            <label className={styles.label}>Postload Messages</label>
            <div className={styles.helpText}>
              Sent <strong>after</strong> loading. One per line.
              {globalPostload.length > 0 && !hasCharacterSettings && (
                <span className={styles.globalInfo}>
                  Global: {globalPostload.join(", ")}
                </span>
              )}
            </div>
            <textarea
              value={postloadText}
              onChange={(e) => setPostloadText(e.target.value)}
              placeholder="Enter custom postload messages&#10;Leave empty to use global settings"
              className={styles.textarea}
            />
            <button onClick={handleSavePostload} className={styles.saveButton}>
              Save Postload
            </button>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={handleUseGlobal}
              className={styles.useGlobalButton}
            >
              Use Global
            </button>
            <button onClick={handleClear} className={styles.clearButton}>
              Clear
            </button>
          </div>

          {/* Save Status */}
          {saveStatus && <div className={styles.saveStatus}>{saveStatus}</div>}
        </div>
      )}
    </div>
  );
};

export default CharacterMessageSettings;
