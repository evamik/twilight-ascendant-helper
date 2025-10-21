import React, { useState, useEffect } from "react";
import styles from "./CharacterList.module.css";

const { ipcRenderer } = window.require ? window.require("electron") : {};

const NON_T4_CLASSES = [
  "Novice",
  "Acolyte",
  "Initiate",
  "Thief",
  "Archer",
  "Swordsman",
  "Witch Hunter",
  "Templar",
  "Druid",
  "Cleric",
  "Mage",
  "Rogue",
  "Hunter",
  "Knight",
  "Slayer",
  "Arch Templar",
  "Arch Druid",
  "Priest",
  "Matriarch",
  "Sage",
  "Wizard",
  "Stalker",
  "Assassin",
  "Marksman",
  "Tracker",
  "Imperial Knight",
  "Crusader",
  "Witcher",
  "Inquisitor",
  "Dark Templar",
  "High Templar",
  "Shapeshifter",
  "Shaman",
];

const CharacterList = ({
  accountName,
  characters,
  onBack,
  onCharacterClick,
  buttonStyle,
  showBackButton = true,
}) => {
  const [showOnlyT4, setShowOnlyT4] = useState(false);

  // Load T4 filter state from settings on mount
  useEffect(() => {
    const loadT4FilterSetting = async () => {
      if (!ipcRenderer) return;

      try {
        const uiSettings = await ipcRenderer.invoke("get-ui-settings");
        if (uiSettings.showOnlyT4Classes !== undefined) {
          setShowOnlyT4(uiSettings.showOnlyT4Classes);
        }
      } catch (error) {
        console.error("Error loading T4 filter preference:", error);
      }
    };

    loadT4FilterSetting();
  }, []);

  const handleT4FilterChange = async (checked) => {
    setShowOnlyT4(checked);

    // Save preference
    if (ipcRenderer) {
      try {
        await ipcRenderer.invoke("set-show-only-t4", checked);
      } catch (error) {
        console.error("Error saving T4 filter preference:", error);
      }
    }
  };

  const isT4Character = (characterName) => {
    // Check if character name starts with any non-T4 class
    return !NON_T4_CLASSES.some((nonT4Class) =>
      characterName.startsWith(nonT4Class)
    );
  };

  const filteredCharacters = showOnlyT4
    ? characters.filter(isT4Character)
    : characters;

  return (
    <>
      {showBackButton && (
        <button
          onClick={onBack}
          className={styles.backButton}
          style={buttonStyle}
        >
          ← Back
        </button>
      )}
      <h2 className={styles.title}>Characters in {accountName}</h2>

      <label className={styles.filterLabel}>
        <input
          type="checkbox"
          checked={showOnlyT4}
          onChange={(e) => handleT4FilterChange(e.target.checked)}
          className={styles.filterCheckbox}
        />
        <span>Show only T4 classes</span>
      </label>

      {filteredCharacters.length === 0 ? (
        <p className={styles.emptyMessage}>
          {showOnlyT4 ? "No T4 characters found" : "No characters found"}
        </p>
      ) : (
        <div className={styles.characterList}>
          {filteredCharacters.map((char, index) => (
            <button
              key={index}
              onClick={() => onCharacterClick(char)}
              className={styles.characterButton}
              style={buttonStyle}
            >
              {char}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default CharacterList;
