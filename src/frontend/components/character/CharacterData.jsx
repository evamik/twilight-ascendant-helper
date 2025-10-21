import React, { useState } from "react";
import styles from "./CharacterData.module.css";
import CharacterMessageSettings from "./CharacterMessageSettings";

const { ipcRenderer } = window.require ? window.require("electron") : {};

const CharacterData = ({
  accountName,
  characterName,
  characterData,
  onBack,
  onLoad,
  buttonStyle,
}) => {
  const [isLoading, setIsLoading] = useState(false);

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
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className={isLoading ? styles.loadButtonDisabled : styles.loadButton}
        style={buttonStyle}
      >
        {isLoading ? "⏳ Loading..." : "🔄 Load"}
      </button>

      {/* Character-specific message settings (separate component) */}
      <CharacterMessageSettings
        accountName={accountName}
        characterName={characterName}
      />

      <h2 className={styles.title}>{characterName}</h2>
      {characterData ? (
        <>
          <p className={styles.fileName}>File: {characterData.fileName}</p>
          <div className={styles.content}>{characterData.content}</div>
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
