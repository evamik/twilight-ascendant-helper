import React, { useState, useMemo, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import type { CharacterData as CharacterDataType } from "../../types";
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

  // Parse loader content into structured data
  const parsedData = useMemo(() => {
    if (!characterData?.content) return null;
    return parseLoaderContent(characterData.content, characterData.fileName);
  }, [characterData?.content, characterData?.fileName]);

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

          {/* Expandable Raw Text Section */}
          <div className={styles.rawTextSection}>
            <button
              onClick={() => setShowRawText(!showRawText)}
              className={styles.toggleButton}
            >
              {showRawText ? "▼" : "▶"} Raw Text Data
            </button>
            {showRawText && (
              <div className={styles.rawContent}>
                <pre className={styles.rawText}>{characterData.content}</pre>
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
