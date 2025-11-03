import React, { useState, useEffect } from "react";
import styles from "./UpdateSettings.module.css";
import { Button } from "../common/buttons";

const { ipcRenderer } = window.require("electron");

interface UpdateInfo {
  version: string;
  downloading?: boolean;
}

const UpdateSettings: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(
    null
  );
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(
    null
  );
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // Listen for update events from backend
    const handleUpdateAvailable = (_event: any, info: UpdateInfo) => {
      setUpdateAvailable(info);
      setMessage(`Update ${info.version} is downloading...`);
    };

    const handleUpdateNotAvailable = () => {
      setMessage("You're on the latest version!");
      setChecking(false);
      setTimeout(() => setMessage(""), 3000);
    };

    const handleDownloadProgress = (_event: any, percent: number) => {
      setDownloadProgress(percent);
    };

    const handleUpdateDownloaded = (_event: any, info: UpdateInfo) => {
      setUpdateDownloaded(info);
      setUpdateAvailable(null);
      setDownloadProgress(null);
      setMessage("");
    };

    const handleUpdateError = (_event: any, error: string) => {
      setMessage(`Update error: ${error}`);
      setChecking(false);
      setUpdateAvailable(null);
      setDownloadProgress(null);
      setTimeout(() => setMessage(""), 5000);
    };

    ipcRenderer.on("update-available", handleUpdateAvailable);
    ipcRenderer.on("update-not-available", handleUpdateNotAvailable);
    ipcRenderer.on("update-download-progress", handleDownloadProgress);
    ipcRenderer.on("update-downloaded", handleUpdateDownloaded);
    ipcRenderer.on("update-error", handleUpdateError);

    return () => {
      ipcRenderer.removeListener("update-available", handleUpdateAvailable);
      ipcRenderer.removeListener(
        "update-not-available",
        handleUpdateNotAvailable
      );
      ipcRenderer.removeListener(
        "update-download-progress",
        handleDownloadProgress
      );
      ipcRenderer.removeListener("update-downloaded", handleUpdateDownloaded);
      ipcRenderer.removeListener("update-error", handleUpdateError);
    };
  }, []);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setMessage("Checking for updates...");
    await ipcRenderer.invoke("check-for-updates");
  };

  const handleRestartAndUpdate = async () => {
    await ipcRenderer.invoke("install-update-and-restart");
  };

  return (
    <div className={styles.container}>
      <h3>Updates</h3>

      <div className={styles.content}>
        {/* Check for Updates Button */}
        {!updateDownloaded && (
          <Button
            onClick={handleCheckForUpdates}
            disabled={checking || updateAvailable !== null}
            variant="info"
            isLoading={checking}
          >
            {checking ? "Checking..." : "Check for Updates"}
          </Button>
        )}

        {/* Download Progress */}
        {downloadProgress !== null && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <span className={styles.progressText}>{downloadProgress}%</span>
          </div>
        )}

        {/* Status Message */}
        {message && <p className={styles.message}>{message}</p>}

        {/* Restart to Update Button */}
        {updateDownloaded && (
          <div className={styles.updateReady}>
            <p className={styles.updateReadyText}>
              Update {updateDownloaded.version} is ready to install!
            </p>
            <Button onClick={handleRestartAndUpdate} variant="warning">
              Restart to Update
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateSettings;
