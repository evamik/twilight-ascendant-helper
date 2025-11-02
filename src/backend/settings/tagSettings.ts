import { Tag } from "../types";
import type { Settings } from "./settings";
import { loadSettings, saveSettings } from "./settings";

// Default tags for IMP readiness
export const DEFAULT_TAGS: Tag[] = [
  { id: "t4", name: "T4", color: "#9c27b0" },
  { id: "imp1", name: "IMP1", color: "#4caf50" },
  { id: "imp2", name: "IMP2", color: "#2196f3" },
  { id: "imp3", name: "IMP3", color: "#ffc107" }, // Amber/gold for visibility on orange background
  { id: "imp1-hm", name: "IMP1 HM", color: "#f44336" },
  { id: "imp2-hm", name: "IMP2 HM", color: "#e91e63" },
];

/**
 * Migrate tag-related settings to current format
 * - Renames "t4-only" tag ID to "t4"
 * - Updates character tag references
 * - Refreshes default tag colors and names
 * - Adds missing default tags
 */
export const migrateTagSettings = (settings: Partial<Settings>): void => {
  // Migrate "t4-only" tag ID to "t4"
  if (settings.availableTags) {
    const t4OnlyIndex = settings.availableTags.findIndex(
      (tag) => tag.id === "t4-only"
    );
    if (t4OnlyIndex !== -1) {
      settings.availableTags[t4OnlyIndex] = {
        id: "t4",
        name: "T4",
        color: settings.availableTags[t4OnlyIndex].color,
      };
    }
  }

  // Migrate character tags from "t4-only" to "t4"
  if (settings.characterTags) {
    Object.keys(settings.characterTags).forEach((key) => {
      const tags = settings.characterTags![key];
      const t4OnlyIndex = tags.indexOf("t4-only");
      const hasT4 = tags.includes("t4");

      if (t4OnlyIndex !== -1) {
        if (hasT4) {
          // Already has "t4" tag, just remove "t4-only"
          tags.splice(t4OnlyIndex, 1);
        } else {
          // Replace "t4-only" with "t4"
          tags[t4OnlyIndex] = "t4";
        }
      }

      // Remove any duplicate tags (just in case)
      settings.characterTags![key] = [...new Set(tags)];
    });
  }

  // Ensure all default tags are present and update their colors
  if (settings.availableTags) {
    // Create a map of default tags for quick lookup
    const defaultTagMap = new Map(DEFAULT_TAGS.map((tag) => [tag.id, tag]));

    // Update existing default tags with current colors and add missing ones
    const updatedTags: Tag[] = [];
    const processedIds = new Set<string>();

    // First, update existing tags
    settings.availableTags.forEach((tag) => {
      const defaultTag = defaultTagMap.get(tag.id);
      if (defaultTag) {
        // This is a default tag - update its color and name from defaults
        updatedTags.push({ ...defaultTag });
      } else {
        // This is a custom tag - keep as is
        updatedTags.push(tag);
      }
      processedIds.add(tag.id);
    });

    // Then, add any missing default tags
    DEFAULT_TAGS.forEach((defaultTag) => {
      if (!processedIds.has(defaultTag.id)) {
        updatedTags.push(defaultTag);
      }
    });

    settings.availableTags = updatedTags;
  }
};

// Get all available tags
export const getAvailableTags = (): Tag[] => {
  const settings = loadSettings();
  return settings.availableTags || DEFAULT_TAGS;
};

// Set available tags (for custom tags)
export const setAvailableTags = (tags: Tag[]): boolean => {
  const settings = loadSettings();
  settings.availableTags = Array.isArray(tags) ? tags : DEFAULT_TAGS;
  return saveSettings(settings);
};

// Get tags for a specific character
export const getCharacterTags = (
  accountName: string,
  characterName: string
): string[] => {
  const settings = loadSettings();
  const key = `${accountName}:${characterName}`;
  return settings.characterTags?.[key] || [];
};

// Set tags for a specific character
export const setCharacterTags = (
  accountName: string,
  characterName: string,
  tagIds: string[]
): boolean => {
  const settings = loadSettings();
  if (!settings.characterTags) {
    settings.characterTags = {};
  }
  const key = `${accountName}:${characterName}`;
  settings.characterTags[key] = Array.isArray(tagIds) ? tagIds : [];
  return saveSettings(settings);
};

// Add a tag to a character
export const addCharacterTag = (
  accountName: string,
  characterName: string,
  tagId: string
): boolean => {
  const currentTags = getCharacterTags(accountName, characterName);
  if (!currentTags.includes(tagId)) {
    currentTags.push(tagId);
    // Use Set to ensure no duplicates
    const uniqueTags = [...new Set(currentTags)];
    return setCharacterTags(accountName, characterName, uniqueTags);
  }
  return true; // Already has this tag
};

// Remove a tag from a character
export const removeCharacterTag = (
  accountName: string,
  characterName: string,
  tagId: string
): boolean => {
  const currentTags = getCharacterTags(accountName, characterName);
  const filteredTags = currentTags.filter((id) => id !== tagId);
  return setCharacterTags(accountName, characterName, filteredTags);
};

// Create a new custom tag
export const createCustomTag = (name: string, color: string): Tag => {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newTag: Tag = { id, name, color };

  const currentTags = getAvailableTags();
  currentTags.push(newTag);
  setAvailableTags(currentTags);

  return newTag;
};

// Delete a custom tag and remove it from all characters
export const deleteCustomTag = (tagId: string): boolean => {
  // Remove from available tags
  const currentTags = getAvailableTags();
  const filteredTags = currentTags.filter((tag) => tag.id !== tagId);
  setAvailableTags(filteredTags);

  // Remove from all characters
  const settings = loadSettings();
  if (settings.characterTags) {
    Object.keys(settings.characterTags).forEach((key) => {
      settings.characterTags![key] = settings.characterTags![key].filter(
        (id) => id !== tagId
      );
    });
    return saveSettings(settings);
  }

  return true;
};

// Get all character tags (useful for filtering/sorting)
export const getAllCharacterTags = (): Record<string, string[]> => {
  const settings = loadSettings();
  return settings.characterTags || {};
};

// Get selected tag filters
export const getSelectedTagFilters = (): string[] => {
  const settings = loadSettings();
  return settings.selectedTagFilters || [];
};

// Set selected tag filters
export const setSelectedTagFilters = (tagIds: string[]): boolean => {
  const settings = loadSettings();
  settings.selectedTagFilters = Array.isArray(tagIds) ? tagIds : [];
  return saveSettings(settings);
};
