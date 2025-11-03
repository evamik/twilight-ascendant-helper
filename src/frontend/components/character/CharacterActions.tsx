import React from "react";
import styles from "./CharacterData.module.css";
import CharacterMessageSettings from "./CharacterMessageSettings";

interface CharacterActionsProps {
  accountName: string;
  characterName: string;
  onBack: () => void;
  onLoad: () => void;
  isLoading: boolean;
  showBackButton?: boolean;
  buttonStyle?: React.CSSProperties;
}

/**
 * CharacterActions Component
 * Displays action buttons for character data (back, load, settings)
 */
const CharacterActions: React.FC<CharacterActionsProps> = ({
  accountName,
  characterName,
  onBack,
  onLoad,
  isLoading,
  showBackButton = true,
  buttonStyle,
}) => {
  return (
    <div className={styles.buttonRow}>
      {showBackButton && (
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
      )}

      <button
        onClick={onLoad}
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
  );
};

export default CharacterActions;
