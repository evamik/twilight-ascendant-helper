import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import type { BackupFileInfo } from "../../types";
import styles from "./CharacterData.module.css";
import { Button } from "../common/buttons";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface BackupViewerProps {
  accountName: string;
  characterName: string;
  onBackupSelected: (fileName: string) => void;
  selectedBackupFileName: string | null;
}

/**
 * BackupViewer Component
 * Displays expandable list of backup files for a character
 */
const BackupViewer: React.FC<BackupViewerProps> = ({
  accountName,
  characterName,
  onBackupSelected,
  selectedBackupFileName,
}) => {
  const [showBackups, setShowBackups] = useState<boolean>(false);
  const [backupFiles, setBackupFiles] = useState<BackupFileInfo[]>([]);
  const [loadingBackup, setLoadingBackup] = useState<string | null>(null);

  // Load backup files when section is expanded
  useEffect(() => {
    if (showBackups && ipcRenderer && accountName && characterName) {
      ipcRenderer
        .invoke("get-character-backups", accountName, characterName)
        .then((backups: BackupFileInfo[]) => {
          setBackupFiles(backups);
        });
    }
  }, [showBackups, accountName, characterName, ipcRenderer]);

  const handleBackupClick = (fileName: string) => {
    setLoadingBackup(fileName);
    onBackupSelected(fileName);
    // Reset loading state after a short delay
    setTimeout(() => setLoadingBackup(null), 500);
  };

  return (
    <div className={styles.rawTextSection}>
      <Button
        onClick={() => setShowBackups(!showBackups)}
        variant="ghost"
        className={styles.toggleButton}
      >
        {showBackups ? "▼" : "▶"} Backup Files
      </Button>
      {showBackups && (
        <div className={styles.rawContent}>
          {backupFiles.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {backupFiles.map((backup) => {
                const date = new Date(backup.modifiedDate);
                const dateStr = date.toLocaleString();
                const isLoading = loadingBackup === backup.fileName;
                const isSelected = selectedBackupFileName === backup.fileName;

                return (
                  <Button
                    key={backup.fileName}
                    onClick={() => handleBackupClick(backup.fileName)}
                    disabled={isLoading}
                    variant={isSelected ? "success" : "secondary"}
                    isLoading={isLoading}
                    fullWidth
                    style={{
                      textAlign: "left",
                      fontSize: "13px",
                    }}
                  >
                    {isLoading ? "Loading..." : `📅 ${dateStr}`}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#aaa", margin: "10px 0" }}>
              No backup files found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BackupViewer;
