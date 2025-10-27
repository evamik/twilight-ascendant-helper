import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./DirectorySettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface DirectoryResult {
  success: boolean;
  path: string;
}

interface DirectorySettingsProps {
  title: string;
  helpText: string;
  getPathHandler: string; // IPC handler name to get current path
  chooseHandler: string; // IPC handler name to choose directory
  resetHandler: string; // IPC handler name to reset to default
  titleColor?: string; // Optional custom title color
}

/**
 * DirectorySettings Component
 * Reusable component for managing directory settings with choose/reset functionality
 */
const DirectorySettings: React.FC<DirectorySettingsProps> = ({
  title,
  helpText,
  getPathHandler,
  chooseHandler,
  resetHandler,
  titleColor = "#ff9800",
}) => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    loadCurrentPath();
  }, []);

  const loadCurrentPath = async () => {
    if (!ipcRenderer) return;
    try {
      setIsLoading(true);
      const path = (await ipcRenderer.invoke(getPathHandler)) as string;
      setCurrentPath(path);
    } catch (error) {
      console.error(`Error loading path from ${getPathHandler}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseDirectory = async () => {
    if (!ipcRenderer) return;

    try {
      setStatusMessage("Choosing directory...");
      const result = (await ipcRenderer.invoke(
        chooseHandler
      )) as DirectoryResult;

      if (result.success) {
        setCurrentPath(result.path);
        setStatusMessage("✓ Directory set successfully");
        setTimeout(() => setStatusMessage(""), 2000);
      } else {
        setStatusMessage("");
      }
    } catch (error) {
      console.error(`Error choosing directory with ${chooseHandler}:`, error);
      setStatusMessage("✗ Failed to choose directory");
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  const handleResetToDefault = async () => {
    if (!ipcRenderer) return;

    if (
      confirm(
        `Reset to default directory? This will restore the standard location.`
      )
    ) {
      try {
        setStatusMessage("Resetting...");
        const result = (await ipcRenderer.invoke(
          resetHandler
        )) as DirectoryResult;

        if (result.success) {
          setCurrentPath(result.path);
          setStatusMessage("✓ Reset to default");
          setTimeout(() => setStatusMessage(""), 2000);
        } else {
          setStatusMessage("✗ Failed to reset");
          setTimeout(() => setStatusMessage(""), 2000);
        }
      } catch (error) {
        console.error(`Error resetting directory with ${resetHandler}:`, error);
        setStatusMessage("✗ Error");
        setTimeout(() => setStatusMessage(""), 2000);
      }
    }
  };

  if (isLoading) {
    return <div className={styles.loadingText}>Loading...</div>;
  }

  return (
    <div>
      <h3 className={styles.title} style={{ color: titleColor }}>
        {title}
      </h3>

      <div className={styles.pathSection}>
        <label className={styles.label}>Current Path:</label>
        <div className={styles.pathDisplay}>{currentPath || "Not set"}</div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleChooseDirectory}
          disabled={isLoading}
          className={
            isLoading ? styles.chooseButtonDisabled : styles.chooseButton
          }
        >
          Choose Directory...
        </button>

        <button
          onClick={handleResetToDefault}
          disabled={isLoading}
          className={
            isLoading ? styles.resetButtonDisabled : styles.resetButton
          }
        >
          Reset to Default
        </button>

        {statusMessage && (
          <span
            className={
              statusMessage.includes("✓")
                ? styles.statusSuccess
                : styles.statusError
            }
          >
            {statusMessage}
          </span>
        )}
      </div>

      <p className={styles.helpText}>{helpText}</p>
    </div>
  );
};

export default DirectorySettings;
