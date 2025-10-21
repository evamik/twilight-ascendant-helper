import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./ReplayDirectorySettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface SaveResult {
  success: boolean;
}

/**
 * ReplayDirectorySettings Component
 * Allows users to configure the replay base directory
 */
const ReplayDirectorySettings: React.FC = () => {
  const [replayDirectory, setReplayDirectory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    loadReplayDirectory();
  }, []);

  const loadReplayDirectory = async () => {
    if (!ipcRenderer) return;

    try {
      setIsLoading(true);
      const directory = (await ipcRenderer.invoke(
        "get-replay-directory"
      )) as string;
      setReplayDirectory(directory);
    } catch (error) {
      console.error("Error loading replay directory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ipcRenderer) return;

    try {
      setSaveStatus("Saving...");
      const result = (await ipcRenderer.invoke(
        "set-replay-directory",
        replayDirectory
      )) as SaveResult;

      if (result.success) {
        setSaveStatus("✓ Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("✗ Failed to save");
        setTimeout(() => setSaveStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error saving replay directory:", error);
      setSaveStatus("✗ Error");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  if (isLoading) {
    return <div className={styles.loadingText}>Loading...</div>;
  }

  return (
    <div>
      <h3 className={styles.title}>Replay Directory</h3>
      <p className={styles.description}>
        Set the base directory for Warcraft III replays. The app will search for
        LastReplay.w3g in account subfolders (e.g.,
        BattleNet/422357159/Replays).
      </p>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Replay Base Directory:</label>
        <input
          type="text"
          value={replayDirectory}
          onChange={(e) => setReplayDirectory(e.target.value)}
          placeholder="C:\Users\YourName\Documents\Warcraft III\BattleNet"
          className={styles.input}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleSave}
          disabled={!replayDirectory}
          className={
            replayDirectory ? styles.saveButton : styles.saveButtonDisabled
          }
        >
          Save
        </button>
        {saveStatus && (
          <span
            className={
              saveStatus.includes("✓")
                ? styles.statusSuccess
                : styles.statusError
            }
          >
            {saveStatus}
          </span>
        )}
      </div>

      <div className={styles.infoBox}>
        <strong>💡 Default:</strong> C:\Users\YourName\Documents\Warcraft
        III\BattleNet\
        <br />
        The app will find the latest LastReplay.w3g across all account folders.
      </div>
    </div>
  );
};

export default ReplayDirectorySettings;
