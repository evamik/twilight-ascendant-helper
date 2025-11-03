import React, { useState, useEffect } from "react";
import styles from "./TagManager.module.css";
import { Button } from "../common/buttons";

const { ipcRenderer } = window.require("electron");

interface Tag {
  id: string;
  name: string;
  color: string;
}

const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#4caf50");

  // Load tags on mount
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const availableTags = await ipcRenderer.invoke("get-available-tags");
      setTags(availableTags);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alert("Tag name cannot be empty");
      return;
    }

    try {
      const result = await ipcRenderer.invoke(
        "create-custom-tag",
        newTagName.trim(),
        newTagColor
      );

      if (result.success) {
        await loadTags();
        setIsCreating(false);
        setNewTagName("");
        setNewTagColor("#4caf50");
      } else {
        alert("Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    // Don't allow deleting default tags
    const defaultTagIds = ["t4", "imp1", "imp2", "imp3", "imp1-hm", "imp2-hm"];

    if (defaultTagIds.includes(tagId)) {
      alert("Cannot delete default tags");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this tag? It will be removed from all characters."
      )
    ) {
      return;
    }

    try {
      const result = await ipcRenderer.invoke("delete-custom-tag", tagId);

      if (result.success) {
        await loadTags();
      } else {
        alert("Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag");
    }
  };

  const isDefaultTag = (tagId: string) => {
    const defaultTagIds = ["t4", "imp1", "imp2", "imp3", "imp1-hm", "imp2-hm"];
    return defaultTagIds.includes(tagId);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Character Tags</h3>
      <p className={styles.description}>
        Create custom tags to organize your characters (e.g., IMP readiness,
        completion status).
      </p>

      <div className={styles.tagsGrid}>
        {tags.map((tag) => (
          <div key={tag.id} className={styles.tagItem}>
            <div
              className={styles.tagChip}
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </div>
            {!isDefaultTag(tag.id) && (
              <Button
                className={styles.deleteButton}
                onClick={() => handleDeleteTag(tag.id)}
                variant="danger"
                size="small"
                title="Delete tag"
              >
                ×
              </Button>
            )}
            {isDefaultTag(tag.id) && (
              <span className={styles.defaultLabel}>Default</span>
            )}
          </div>
        ))}
      </div>

      {!isCreating ? (
        <Button
          className={styles.createButton}
          onClick={() => setIsCreating(true)}
          variant="primary"
        >
          + Create New Tag
        </Button>
      ) : (
        <div className={styles.createForm}>
          <input
            type="text"
            className={styles.tagNameInput}
            placeholder="Tag name (e.g., 'IMP3 HM')"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            maxLength={20}
          />
          <div className={styles.colorPicker}>
            <label>Color:</label>
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
            />
            <div
              className={styles.colorPreview}
              style={{ backgroundColor: newTagColor }}
            />
          </div>
          <div className={styles.formButtons}>
            <Button variant="success" onClick={handleCreateTag}>
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreating(false);
                setNewTagName("");
                setNewTagColor("#4caf50");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
