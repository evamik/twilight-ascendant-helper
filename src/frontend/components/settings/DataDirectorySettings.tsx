import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./DataDirectorySettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface DirectoryResult {
  success: boolean;
  path: string;
}

const DataDirectorySettings: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadCurrentPath();
  }, []);

  const loadCurrentPath = async () => {
    if (!ipcRenderer) return;
    try {
      const path = (await ipcRenderer.invoke("get-data-path")) as string;
      setCurrentPath(path);
    } catch (error) {
      console.error("Error loading data path:", error);
    }
  };

  const handleChooseDirectory = async () => {
    if (!ipcRenderer) return;
    setIsLoading(true);
    try {
      const result = (await ipcRenderer.invoke(
        "choose-custom-directory"
      )) as DirectoryResult;
      if (result.success) {
        setCurrentPath(result.path);
        alert(
          "Custom directory set successfully! The app will now use this folder."
        );
      }
    } catch (error) {
      console.error("Error choosing directory:", error);
      alert("Failed to set custom directory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!ipcRenderer) return;
    if (
      confirm(
        "Reset to default directory? This will use the standard Warcraft III location."
      )
    ) {
      setIsLoading(true);
      try {
        const result = (await ipcRenderer.invoke(
          "reset-to-default-directory"
        )) as DirectoryResult;
        if (result.success) {
          setCurrentPath(result.path);
          alert("Reset to default directory successfully!");
        }
      } catch (error) {
        console.error("Error resetting directory:", error);
        alert("Failed to reset to default directory");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h3 className={styles.title}>Data Directory</h3>

      <div className={styles.pathSection}>
        <label className={styles.label}>Current Path:</label>
        <div className={styles.pathDisplay}>{currentPath || "Loading..."}</div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleChooseDirectory}
          disabled={isLoading}
          className={
            isLoading ? styles.chooseButtonDisabled : styles.chooseButton
          }
        >
          Choose Custom Directory...
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
      </div>

      <p className={styles.helpText}>
        The data directory should contain your account folders with character
        saves. By default, this is located at:
        <br />
        <code>Documents\Warcraft III\CustomMapData\Twilight Ascendant</code>
      </p>
    </div>
  );
};

export default DataDirectorySettings;
