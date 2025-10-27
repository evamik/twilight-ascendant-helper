import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./CharacterList.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

const NON_T4_CLASSES: string[] = [
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

interface UISettings {
  showOnlyT4Classes?: boolean;
  favoriteCharacters?: string[]; // Array of "accountName:characterName"
}

interface CharacterListProps {
  accountName: string;
  characters: string[];
  onBack: () => void;
  onCharacterClick: (characterName: string) => void;
  buttonStyle?: React.CSSProperties;
  showBackButton?: boolean;
}

const CharacterList: React.FC<CharacterListProps> = ({
  accountName,
  characters,
  onBack,
  onCharacterClick,
  buttonStyle,
  showBackButton = true,
}) => {
  const [showOnlyT4, setShowOnlyT4] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);

  // Load T4 filter state and favorites from settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!ipcRenderer) {
        setSettingsLoaded(true);
        return;
      }

      try {
        const uiSettings = (await ipcRenderer.invoke(
          "get-ui-settings"
        )) as UISettings;
        if (uiSettings.showOnlyT4Classes !== undefined) {
          setShowOnlyT4(uiSettings.showOnlyT4Classes);
        }
        if (uiSettings.favoriteCharacters) {
          // Filter favorites for current account
          const accountFavorites = uiSettings.favoriteCharacters
            .filter((fav) => fav.startsWith(`${accountName}:`))
            .map((fav) => fav.substring(accountName.length + 1));
          setFavorites(new Set(accountFavorites));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [accountName]);

  const handleT4FilterChange = async (checked: boolean) => {
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

  const toggleFavorite = async (e: React.MouseEvent, characterName: string) => {
    e.stopPropagation(); // Prevent character selection

    const newFavorites = new Set(favorites);
    const favoriteKey = `${accountName}:${characterName}`;

    if (favorites.has(characterName)) {
      newFavorites.delete(characterName);
    } else {
      newFavorites.add(characterName);
    }

    setFavorites(newFavorites);

    // Save to settings
    if (ipcRenderer) {
      try {
        // Load current favorites from all accounts
        const uiSettings = (await ipcRenderer.invoke(
          "get-ui-settings"
        )) as UISettings;
        const allFavorites = uiSettings.favoriteCharacters || [];

        // Remove old favorite for this character (if exists)
        const otherFavorites = allFavorites.filter(
          (fav) => fav !== favoriteKey
        );

        // Add new favorite if favorited
        const updatedFavorites = newFavorites.has(characterName)
          ? [...otherFavorites, favoriteKey]
          : otherFavorites;

        await ipcRenderer.invoke("set-favorite-characters", updatedFavorites);
      } catch (error) {
        console.error("Error saving favorite:", error);
      }
    }
  };

  const isT4Character = (characterName: string): boolean => {
    // Check if character name starts with any non-T4 class
    return !NON_T4_CLASSES.some((nonT4Class) =>
      characterName.startsWith(nonT4Class)
    );
  };

  const filteredCharacters = showOnlyT4
    ? characters.filter(isT4Character)
    : characters;

  // Sort characters: favorites first, then alphabetically
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    const aIsFavorite = favorites.has(a);
    const bIsFavorite = favorites.has(b);

    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return a.localeCompare(b);
  });

  // Don't render until settings are loaded to prevent flashing
  if (!settingsLoaded) {
    return null;
  }

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
          {sortedCharacters.map((char, index) => {
            const heroIconPath = `/icons/heroes/${char}.png`;
            const isFavorite = favorites.has(char);
            return (
              <button
                key={index}
                onClick={() => onCharacterClick(char)}
                className={styles.characterButton}
                style={buttonStyle}
              >
                <img
                  src={heroIconPath}
                  alt={char}
                  className={styles.heroIcon}
                  onError={(e) => {
                    // Hide icon if image fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className={styles.characterName}>{char}</span>
                <button
                  onClick={(e) => toggleFavorite(e, char)}
                  className={styles.favoriteButton}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  {isFavorite ? "⭐" : "☆"}
                </button>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

export default CharacterList;
