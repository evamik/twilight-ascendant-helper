import React, { useState, useEffect } from "react";
import type { ParsedLoaderData } from "../../utils/loaderParser";
import type { IpcRenderer } from "../../types/electron";
import styles from "./FormattedLoader.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface FormattedLoaderProps {
  data: ParsedLoaderData;
  accountName?: string;
  characterName?: string;
}

/**
 * FormattedLoader Component
 * Displays parsed loader data in a clean, readable format
 */
const FormattedLoader: React.FC<FormattedLoaderProps> = ({
  data,
  accountName,
  characterName,
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [characterTags, setCharacterTags] = useState<string[]>([]);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      if (!ipcRenderer || !accountName || !characterName) return;

      try {
        const tags = await ipcRenderer.invoke("get-available-tags");
        setAvailableTags(tags);

        const charTags = await ipcRenderer.invoke(
          "get-character-tags",
          accountName,
          characterName
        );
        setCharacterTags(charTags);
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };

    loadTags();
  }, [accountName, characterName]);

  const toggleTag = async (tagId: string) => {
    if (!ipcRenderer || !accountName || !characterName) return;

    const hasTag = characterTags.includes(tagId);

    try {
      if (hasTag) {
        await ipcRenderer.invoke(
          "remove-character-tag",
          accountName,
          characterName,
          tagId
        );
        setCharacterTags(characterTags.filter((id) => id !== tagId));
      } else {
        await ipcRenderer.invoke(
          "add-character-tag",
          accountName,
          characterName,
          tagId
        );
        setCharacterTags([...characterTags, tagId]);
      }
    } catch (error) {
      console.error("Error toggling tag:", error);
    }
  };

  // Construct the hero icon path
  const heroIconPath = `./icons/heroes/${data.hero}.png`;

  return (
    <div className={styles.container}>
      {/* Hero Name - Big Header with Icon */}
      <div className={styles.heroHeader}>
        <img
          src={heroIconPath}
          alt={data.hero}
          className={styles.heroIcon}
          onError={(e) => {
            // Hide icon if image fails to load
            e.currentTarget.style.display = "none";
          }}
        />
        <h2 className={styles.heroName}>{data.hero}</h2>
      </div>

      {/* Tags Section */}
      {accountName && characterName && (
        <div className={styles.tagsSection}>
          <h3 className={styles.tagsSectionTitle}>Tags</h3>
          <div className={styles.tagsContainer}>
            {availableTags.map((tag) => {
              const isActive = characterTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  className={`${styles.tagButton} ${
                    isActive ? styles.tagActive : ""
                  }`}
                  style={isActive ? { backgroundColor: tag.color } : undefined}
                  onClick={() => toggleTag(tag.id)}
                  title={
                    isActive ? `Remove ${tag.name} tag` : `Add ${tag.name} tag`
                  }
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resources Section */}
      <div className={styles.resources}>
        {data.level && (
          <div className={styles.resourceItem}>
            <span className={styles.resourceLabel}>⭐ Level:</span>
            <span className={styles.resourceValue}>{data.level}</span>
          </div>
        )}
        <div className={styles.resourceItem}>
          <span className={styles.resourceLabel}>💰 Gold:</span>
          <span className={styles.resourceValue}>
            {parseInt(data.gold).toLocaleString()}
          </span>
        </div>
        <div className={styles.resourceItem}>
          <span className={styles.resourceLabel}>⚡ Power Shards:</span>
          <span className={styles.resourceValue}>
            {parseInt(data.powerShards).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Inventory Card */}
      <div className={styles.inventoryCard}>
        <h3 className={styles.cardTitle}>
          🎒 Inventory ({data.inventory.length}/6)
        </h3>
        <div className={styles.itemsGrid}>
          {data.inventory.length > 0 ? (
            data.inventory.map((item) => (
              <div key={item.slot} className={styles.itemSlot}>
                <span className={styles.slotNumber}>{item.slot}</span>
                <span className={styles.itemName}>{item.itemName}</span>
              </div>
            ))
          ) : (
            <div className={styles.emptySlot}>No items</div>
          )}
        </div>
      </div>

      {/* Stash Cards */}
      {data.stashes.map((stash) => (
        <div key={stash.stashNumber} className={styles.stashCard}>
          <h3 className={styles.cardTitle}>
            📦 Stash {stash.stashNumber} ({stash.items.length}/6)
          </h3>
          <div className={styles.itemsGrid}>
            {stash.items.length > 0 ? (
              stash.items.map((item) => (
                <div key={item.slot} className={styles.itemSlot}>
                  <span className={styles.slotNumber}>{item.slot}</span>
                  <span className={styles.itemName}>{item.itemName}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptySlot}>No items</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormattedLoader;
