import React from "react";
import type { ParsedLoaderData } from "../../utils/loaderParser";
import styles from "./FormattedLoader.module.css";

interface FormattedLoaderProps {
  data: ParsedLoaderData;
}

/**
 * FormattedLoader Component
 * Displays parsed loader data in a clean, readable format
 */
const FormattedLoader: React.FC<FormattedLoaderProps> = ({ data }) => {
  return (
    <div className={styles.container}>
      {/* Hero Name - Big Header */}
      <h2 className={styles.heroName}>{data.hero}</h2>

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
