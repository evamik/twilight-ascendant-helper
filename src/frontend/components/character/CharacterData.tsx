import React, { useState, useMemo, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import type {
  CharacterData as CharacterDataType,
  BackupFileInfo,
} from "../../types";
import styles from "./CharacterData.module.css";
import CharacterMessageSettings from "./CharacterMessageSettings";
import FormattedLoader from "./FormattedLoader";
import { parseLoaderContent } from "../../utils/loaderParser";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface CharacterDataProps {
  accountName: string;
  characterName: string;
  characterData: CharacterDataType | null;
  onBack: () => void;
  onLoad?: () => void;
  buttonStyle?: React.CSSProperties;
  showBackButton?: boolean; // Whether to show the back button
}

const CharacterData: React.FC<CharacterDataProps> = ({
  accountName,
  characterName,
  characterData,
  onBack,
  onLoad,
  buttonStyle,
  showBackButton = true, // Default to true
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [showBackups, setShowBackups] = useState<boolean>(false);
  const [backupFiles, setBackupFiles] = useState<BackupFileInfo[]>([]);
  const [loadingBackup, setLoadingBackup] = useState<string | null>(null);
  const [selectedBackupData, setSelectedBackupData] =
    useState<CharacterDataType | null>(null);

  // Watch for character file changes
  useEffect(() => {
    if (!ipcRenderer || !accountName || !characterName) return;

    // Start watching this character file
    ipcRenderer.invoke("watch-character-file", accountName, characterName);

    // Listen for file change events
    const handleFileChange = (
      _event: any,
      data: { accountName: string; characterName: string }
    ) => {
      if (
        data.accountName === accountName &&
        data.characterName === characterName
      ) {
        console.log("[CharacterData] File changed, reloading data...");
        if (onLoad) {
          onLoad();
        }
      }
    };

    ipcRenderer.on("character-file-changed", handleFileChange);

    // Cleanup: stop watching and remove listener
    return () => {
      ipcRenderer.invoke("unwatch-character-file", accountName, characterName);
      ipcRenderer.removeListener("character-file-changed", handleFileChange);
    };
  }, [accountName, characterName, onLoad, ipcRenderer]);

  // Load backup files when backups section is expanded
  useEffect(() => {
    if (showBackups && ipcRenderer && accountName && characterName) {
      ipcRenderer
        .invoke("get-character-backups", accountName, characterName)
        .then((backups: BackupFileInfo[]) => {
          setBackupFiles(backups);
        });
    }
  }, [showBackups, accountName, characterName, ipcRenderer]);

  // Handle loading a backup file
  const handleLoadBackup = async (fileName: string) => {
    if (!ipcRenderer || loadingBackup) return;

    setLoadingBackup(fileName);
    try {
      const backupData = await ipcRenderer.invoke(
        "load-character-backup",
        accountName,
        characterName,
        fileName
      );
      setSelectedBackupData(backupData);
    } catch (error) {
      console.error("Error loading backup:", error);
    } finally {
      setLoadingBackup(null);
    }
  };

  // Handle closing backup view
  const handleCloseBackup = () => {
    setSelectedBackupData(null);
  };

  // Determine which data to display (backup or current)
  const displayData = selectedBackupData || characterData;

  // Parse loader content into structured data
  const parsedData = useMemo(() => {
    if (!displayData?.content) return null;
    return parseLoaderContent(displayData.content, displayData.fileName);
  }, [displayData?.content, displayData?.fileName]);

  const handleLoad = async () => {
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);

    try {
      // Send the load command to the game with character data and account/character names
      if (ipcRenderer && characterData) {
        const result = await ipcRenderer.invoke(
          "send-load-command",
          characterData,
          accountName,
          characterName
        );
        if (!result.success) {
          console.error("Failed to send load command:", result.error);
          alert(`Failed to load: ${result.error}`);
        } else {
          console.log("Load command sent successfully");
        }
      } else if (!characterData) {
        console.error("No character data available");
        alert("No character data available. Please wait for data to load.");
      }

      // Then, refresh the character data
      if (onLoad) {
        onLoad();
      }
    } finally {
      // Re-enable button after 3 seconds (load sequence takes time)
      setTimeout(() => setIsLoading(false), 3000);
    }
  };

  return (
    <>
      <div className={styles.buttonRow}>
        {showBackButton && (
          <button onClick={onBack} className={styles.backButton}>
            ← Back
          </button>
        )}

        <button
          onClick={handleLoad}
          disabled={isLoading}
          className={isLoading ? styles.loadButtonDisabled : styles.loadButton}
          style={buttonStyle}
        >
          {isLoading ? "⏳ Loading..." : "🔄 Load"}
        </button>

        {/* Character-specific message settings (inline button) */}
        <CharacterMessageSettings
          accountName={accountName}
          characterName={characterName}
        />
      </div>

      {characterData ? (
        <>
          {/* Show backup indicator if viewing a backup */}
          {selectedBackupData && (
            <div
              style={{
                background: "rgba(255, 165, 0, 0.2)",
                border: "1px solid #ffa500",
                borderRadius: "4px",
                padding: "8px 12px",
                marginBottom: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#ffa500", fontWeight: "bold" }}>
                📂 Viewing Backup: {selectedBackupData.fileName}
              </span>
              <button
                onClick={handleCloseBackup}
                style={{
                  padding: "4px 12px",
                  background: "#555",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ← Back to Current
              </button>
            </div>
          )}

          {/* Formatted View */}
          {parsedData && (
            <div className={styles.formattedSection}>
              <FormattedLoader
                data={parsedData}
                accountName={accountName}
                characterName={characterName}
              />
            </div>
          )}

          {/* Expandable Backups Section */}
          <div className={styles.rawTextSection}>
            <button
              onClick={() => setShowBackups(!showBackups)}
              className={styles.toggleButton}
            >
              {showBackups ? "▼" : "▶"} Backup Files
            </button>
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

                      return (
                        <button
                          key={backup.fileName}
                          onClick={() => handleLoadBackup(backup.fileName)}
                          disabled={isLoading}
                          style={{
                            padding: "8px 12px",
                            background:
                              selectedBackupData?.fileName === backup.fileName
                                ? "#4caf50"
                                : "rgba(255, 255, 255, 0.1)",
                            color: "#fff",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            cursor: isLoading ? "wait" : "pointer",
                            textAlign: "left",
                            fontSize: "13px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.background =
                                selectedBackupData?.fileName === backup.fileName
                                  ? "#45a049"
                                  : "rgba(255, 255, 255, 0.15)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isLoading) {
                              e.currentTarget.style.background =
                                selectedBackupData?.fileName === backup.fileName
                                  ? "#4caf50"
                                  : "rgba(255, 255, 255, 0.1)";
                            }
                          }}
                        >
                          {isLoading ? "⏳ Loading..." : `📅 ${dateStr}`}
                        </button>
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

          {/* Expandable Raw Text Section */}
          <div className={styles.rawTextSection}>
            <button
              onClick={() => setShowRawText(!showRawText)}
              className={styles.toggleButton}
            >
              {showRawText ? "▼" : "▶"} Raw Text Data
            </button>
            {showRawText && displayData && (
              <div className={styles.rawContent}>
                <pre className={styles.rawText}>{displayData.content}</pre>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className={styles.emptyMessage}>
          No data found. Click Load to refresh.
        </p>
      )}
    </>
  );
};

export default CharacterData;
