import React from "react";
import type { ParsedLoaderData } from "../../utils/loaderParser";
import { parseLoaderContent } from "../../utils/loaderParser";
import styles from "./FormattedInventory.module.css";

interface FormattedInventoryProps {
  content: string;
}

/**
 * FormattedInventory Component
 * Displays inventory data in a formatted view with the same styling as FormattedLoader
 * Shows inventory and stash items with cards layout
 */
const FormattedInventory: React.FC<FormattedInventoryProps> = ({ content }) => {
  // Parse the inventory content using the same parser as loader
  const data: ParsedLoaderData | null = parseLoaderContent(content);

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Unable to parse inventory data. The file format may be invalid.
        </div>
      </div>
    );
  }

  // Helper function to render all 6 slots (including empty ones)
  const renderAllSlots = (
    items: { slot: number; itemName: string }[],
    maxSlots: number = 6
  ) => {
    const slots = [];
    for (let i = 1; i <= maxSlots; i++) {
      const item = items.find((item) => item.slot === i);
      slots.push(
        <div
          key={i}
          className={item ? styles.itemSlot : styles.emptySlot}
          title={item ? item.itemName : "Empty slot"}
        >
          {item ? (
            <span className={styles.itemName}>{item.itemName}</span>
          ) : (
            <span className={styles.emptySlotText}>—</span>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className={styles.container}>
      {/* Hero Info Header */}
      {data.hero && (
        <div className={styles.heroHeader}>
          <div className={styles.heroTitleSection}>
            <img
              src={`./icons/heroes/${data.hero}.png`}
              alt={data.hero}
              className={styles.heroIcon}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <h2 className={styles.heroName}>{data.hero}</h2>
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
        {data.gold && (
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
        )}
        {data.powerShards && (
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
        )}
      </div>

      {/* Cards Grid Container - Inventory and Stashes */}
      <div className={styles.cardsGrid}>
        {/* Inventory Card */}
        <div className={styles.inventoryCard}>
          <h3 className={styles.cardTitle}>
            🎒 Inventory ({data.inventory.length}/6)
          </h3>
          <div className={styles.itemsGrid}>
            {renderAllSlots(data.inventory, 6)}
          </div>
        </div>

        {/* Stash Cards */}
        {data.stashes.map((stash) => (
          <div key={stash.stashNumber} className={styles.stashCard}>
            <h3 className={styles.cardTitle}>
              📦 Stash {stash.stashNumber} ({stash.items.length}/6)
            </h3>
            <div className={styles.itemsGrid}>
              {renderAllSlots(stash.items, 6)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormattedInventory;
