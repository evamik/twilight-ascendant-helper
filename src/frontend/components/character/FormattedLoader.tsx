import React, { useState, useEffect } from "react";
import type { ParsedLoaderData } from "../../utils/loaderParser";
import type { IpcRenderer } from "../../types/electron";
import styles from "./FormattedLoader.module.css";
import { Button } from "../common/buttons";
import { hasHeroGuide, getHeroGuideUrl } from "../../constants/guideUrls";
import { useGuideNavigation } from "../../contexts/GuideNavigationContext";

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
  const { navigateToGuide } = useGuideNavigation();

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

  // Check if this hero has a guide URL
  const heroHasGuide = hasHeroGuide(data.hero);

  // Handle opening the guide for this hero
  const handleOpenInGuide = () => {
    const guideUrl = getHeroGuideUrl(data.hero);
    if (guideUrl) {
      navigateToGuide(guideUrl);
    }
  };

  return (
    <div className={styles.container}>
      {/* Hero Name - Big Header with Icon */}
      <div className={styles.heroHeader}>
        <div className={styles.heroTitleSection}>
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
        {heroHasGuide && (
          <Button
            variant="info"
            size="medium"
            onClick={handleOpenInGuide}
            className={styles.guideButton}
            title={`Open ${data.hero} in Guide`}
          >
            📚 Open in Guide
          </Button>
        )}
      </div>

      {/* Tags Section */}
      {accountName && characterName && (
        <div className={styles.tagsSection}>
          <h3 className={styles.tagsSectionTitle}>Tags</h3>
          <div className={styles.tagsContainer}>
            {availableTags.map((tag) => {
              const isActive = characterTags.includes(tag.id);
              return (
                <Button
                  key={tag.id}
                  variant={isActive ? "success" : "secondary"}
                  size="small"
                  className={styles.tagButton}
                  style={isActive ? { backgroundColor: tag.color } : undefined}
                  onClick={() => toggleTag(tag.id)}
                  title={
                    isActive ? `Remove ${tag.name} tag` : `Add ${tag.name} tag`
                  }
                >
                  {tag.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Resources Section */}
      <div className={styles.resources}>
        {data.level && (
          <div className={styles.resourceItem}>
            <span className={styles.resourceLabel}>Level:</span>
            <span className={styles.resourceValue}>{data.level}</span>
          </div>
        )}
        <div className={styles.resourceItem}>
          <img
            src="icons/general/gold.png"
            alt="Gold"
            style={{ width: "16px", height: "16px" }}
          />
          <span className={styles.resourceValue}>
            {parseInt(data.gold).toLocaleString()}
          </span>
        </div>
        <div className={styles.resourceItem}>
          <img
            src="icons/general/shard.png"
            alt="Power Shards"
            style={{ width: "16px", height: "16px" }}
          />
          <span className={styles.resourceValue}>
            {parseInt(data.powerShards).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Cards Grid Container - Inventory and Stashes */}
      <div className={styles.cardsGrid}>
        {/* Inventory Card */}
        <div className={styles.inventoryCard}>
          <h3 className={styles.cardTitle}>
            🎒 Inventory ({data.inventory.length}/6)
          </h3>
          <div className={styles.itemsGrid}>
            {data.inventory.length > 0 ? (
              data.inventory.map((item) => (
                <div
                  key={item.slot}
                  className={styles.itemSlot}
                  title={item.itemName}
                >
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
                  <div
                    key={item.slot}
                    className={styles.itemSlot}
                    title={item.itemName}
                  >
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
    </div>
  );
};

export default FormattedLoader;
