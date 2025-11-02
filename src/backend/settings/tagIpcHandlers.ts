import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
  getAvailableTags,
  setAvailableTags,
  getCharacterTags,
  addCharacterTag,
  removeCharacterTag,
  createCustomTag,
  deleteCustomTag,
  getAllCharacterTags,
  getSelectedTagFilters,
  setSelectedTagFilters,
} from "./tagSettings";
import { trackFeature } from "./analytics";
import { SaveResult } from "../types";

/**
 * Register IPC handlers for tag management operations
 */
export const registerTagIpcHandlers = (): void => {
  // Get all available tags
  ipcMain.handle("get-available-tags", async () => {
    return getAvailableTags();
  });

  // Set available tags
  ipcMain.handle(
    "set-available-tags",
    async (_event: IpcMainInvokeEvent, tags: any[]): Promise<SaveResult> => {
      const success = setAvailableTags(tags);
      if (success) {
        trackFeature("custom_tags_updated", { count: tags.length });
      }
      return { success };
    }
  );

  // Get tags for a specific character
  ipcMain.handle(
    "get-character-tags",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string
    ) => {
      return getCharacterTags(accountName, characterName);
    }
  );

  // Add a tag to a character
  ipcMain.handle(
    "add-character-tag",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string,
      tagId: string
    ): Promise<SaveResult> => {
      const success = addCharacterTag(accountName, characterName, tagId);
      if (success) {
        trackFeature("character_tag_added", {
          accountName,
          characterName,
          tagId,
        });
      }
      return { success };
    }
  );

  // Remove a tag from a character
  ipcMain.handle(
    "remove-character-tag",
    async (
      _event: IpcMainInvokeEvent,
      accountName: string,
      characterName: string,
      tagId: string
    ): Promise<SaveResult> => {
      const success = removeCharacterTag(accountName, characterName, tagId);
      if (success) {
        trackFeature("character_tag_removed", {
          accountName,
          characterName,
          tagId,
        });
      }
      return { success };
    }
  );

  // Create a new custom tag
  ipcMain.handle(
    "create-custom-tag",
    async (
      _event: IpcMainInvokeEvent,
      name: string,
      color: string
    ): Promise<{ success: boolean; tag?: any }> => {
      try {
        const tag = createCustomTag(name, color);
        trackFeature("custom_tag_created", { name, color });
        return { success: true, tag };
      } catch (error) {
        console.error("Error creating custom tag:", error);
        return { success: false };
      }
    }
  );

  // Delete a custom tag
  ipcMain.handle(
    "delete-custom-tag",
    async (_event: IpcMainInvokeEvent, tagId: string): Promise<SaveResult> => {
      const success = deleteCustomTag(tagId);
      if (success) {
        trackFeature("custom_tag_deleted", { tagId });
      }
      return { success };
    }
  );

  // Get all character tags (for filtering/sorting)
  ipcMain.handle("get-all-character-tags", async () => {
    return getAllCharacterTags();
  });

  // Get selected tag filters
  ipcMain.handle("get-selected-tag-filters", async (): Promise<string[]> => {
    return getSelectedTagFilters();
  });

  // Set selected tag filters
  ipcMain.handle(
    "set-selected-tag-filters",
    async (
      _event: IpcMainInvokeEvent,
      tagIds: string[]
    ): Promise<SaveResult> => {
      const success = setSelectedTagFilters(tagIds);
      return { success };
    }
  );
};
