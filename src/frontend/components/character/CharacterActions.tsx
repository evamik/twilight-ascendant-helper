import React from "react";
import styles from "./CharacterData.module.css";
import CharacterMessageSettings from "./CharacterMessageSettings";
import { Button } from "../common/buttons";

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
        <Button onClick={onBack} variant="secondary">
          ← Back
        </Button>
      )}

      <Button
        onClick={onLoad}
        disabled={isLoading}
        variant="success"
        isLoading={isLoading}
        style={buttonStyle}
      >
        {isLoading ? "Loading..." : "🔄 Load"}
      </Button>

      {/* Character-specific message settings (inline button) */}
      <CharacterMessageSettings
        accountName={accountName}
        characterName={characterName}
      />
    </div>
  );
};

export default CharacterActions;
