import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./CharacterList.module.css";
import CharacterCard from "./CharacterCard";
import TagFilterButtons from "./TagFilterButtons";
import { isT4Character } from "../../constants/classTypes";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface UISettings {
  favoriteCharacters?: string[]; // Array of "accountName:characterName"
  availableTags?: Tag[];
  characterTags?: Record<string, string[]>; // "accountName:characterName" → tag IDs
}

interface CharacterSummary {
  name: string;
  level: number;
  powerShards: number;
}

interface CharacterListProps {
  accountName: string;
  characters: CharacterSummary[];
  onBack: () => void;
  onCharacterClick: (characterName: string) => void;
  onLoad?: (characterName: string) => void;
  buttonStyle?: React.CSSProperties;
  showBackButton?: boolean;
}

const CharacterList: React.FC<CharacterListProps> = ({
  accountName,
  characters,
  onBack,
  onCharacterClick,
  onLoad,
  buttonStyle,
  showBackButton = true,
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [characterTags, setCharacterTags] = useState<Record<string, string[]>>(
    {}
  );
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(
    new Set()
  );

  // Auto-tag T4 characters that don't have the T4 tag yet
  const autoTagT4Characters = async (
    currentCharacterTags: Record<string, string[]>
  ) => {
    if (!ipcRenderer) return;

    let hasChanges = false;

    for (const char of characters) {
      const characterKey = `${accountName}:${char.name}`;
      const existingTags = currentCharacterTags[characterKey] || [];

      // If character is T4 and doesn't have the T4 tag, add it
      if (isT4Character(char.name) && !existingTags.includes("t4")) {
        try {
          await ipcRenderer.invoke(
            "add-character-tag",
            accountName,
            char.name,
            "t4"
          );
          hasChanges = true;
        } catch (error) {
          console.error(`Error auto-tagging ${char.name}:`, error);
        }
      }
    }

    // Reload character tags if any changes were made
    if (hasChanges) {
      try {
        const uiSettings = (await ipcRenderer.invoke(
          "get-ui-settings"
        )) as UISettings;
        if (uiSettings.characterTags) {
          setCharacterTags(uiSettings.characterTags);
        }
      } catch (error) {
        console.error("Error reloading character tags:", error);
      }
    }
  };

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
        if (uiSettings.favoriteCharacters) {
          // Filter favorites for current account
          const accountFavorites = uiSettings.favoriteCharacters
            .filter((fav) => fav.startsWith(`${accountName}:`))
            .map((fav) => fav.substring(accountName.length + 1));
          setFavorites(new Set(accountFavorites));
        }
        if (uiSettings.availableTags) {
          setAvailableTags(uiSettings.availableTags);
        }
        if (uiSettings.characterTags) {
          setCharacterTags(uiSettings.characterTags);
        }

        // Load selected tag filters
        const savedFilters = (await ipcRenderer.invoke(
          "get-selected-tag-filters"
        )) as string[];
        if (savedFilters && savedFilters.length > 0) {
          setSelectedTagFilters(new Set(savedFilters));
        }

        // Auto-tag T4 characters
        await autoTagT4Characters(uiSettings.characterTags || {});
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [accountName, characters]);

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

  const getCharacterTags = (characterName: string): string[] => {
    const characterKey = `${accountName}:${characterName}`;
    return characterTags[characterKey] || [];
  };

  const toggleTagFilter = async (tagId: string) => {
    const newFilters = new Set(selectedTagFilters);
    if (newFilters.has(tagId)) {
      newFilters.delete(tagId);
    } else {
      newFilters.add(tagId);
    }
    setSelectedTagFilters(newFilters);

    // Save to settings
    if (ipcRenderer) {
      try {
        await ipcRenderer.invoke(
          "set-selected-tag-filters",
          Array.from(newFilters)
        );
      } catch (error) {
        console.error("Error saving tag filters:", error);
      }
    }
  };

  const clearAllTagFilters = async () => {
    setSelectedTagFilters(new Set());

    // Save to settings
    if (ipcRenderer) {
      try {
        await ipcRenderer.invoke("set-selected-tag-filters", []);
      } catch (error) {
        console.error("Error clearing tag filters:", error);
      }
    }
  };

  // Apply filters
  let filteredCharacters = characters;

  // Tag filter - character must have ALL selected tags (AND logic)
  if (selectedTagFilters.size > 0) {
    filteredCharacters = filteredCharacters.filter((char) => {
      const charTags = getCharacterTags(char.name);
      // Check if character has all selected tags
      return Array.from(selectedTagFilters).every((tagId) =>
        charTags.includes(tagId)
      );
    });
  }

  // Sort characters: favorites first, then alphabetically
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    const aIsFavorite = favorites.has(a.name);
    const bIsFavorite = favorites.has(b.name);

    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return a.name.localeCompare(b.name);
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

      {/* Tag Filter Buttons */}
      <TagFilterButtons
        availableTags={availableTags}
        selectedTagFilters={selectedTagFilters}
        onToggleTag={toggleTagFilter}
        onClearAll={clearAllTagFilters}
      />

      {filteredCharacters.length === 0 ? (
        <p className={styles.emptyMessage}>
          {selectedTagFilters.size > 0
            ? `No characters with selected tag${
                selectedTagFilters.size > 1 ? "s" : ""
              }`
            : "No characters found"}
        </p>
      ) : (
        <div className={styles.characterList}>
          {sortedCharacters.map((char) => {
            const isFavorite = favorites.has(char.name);
            const charTags = getCharacterTags(char.name);

            return (
              <CharacterCard
                key={`${accountName}:${char.name}`}
                characterName={char.name}
                level={char.level}
                powerShards={char.powerShards}
                accountName={accountName}
                isFavorite={isFavorite}
                tags={charTags}
                availableTags={availableTags}
                buttonStyle={buttonStyle}
                onCharacterClick={onCharacterClick}
                onLoad={onLoad}
                onToggleFavorite={toggleFavorite}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default CharacterList;
