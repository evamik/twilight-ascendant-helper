import React from "react";
import type { ParsedDropsData } from "../../utils/dropsParser";
import styles from "./FormattedDrops.module.css";

interface FormattedDropsProps {
  data: ParsedDropsData;
}

/**
 * FormattedDrops Component
 * Displays parsed drops data in a clean, readable format
 */
const FormattedDrops: React.FC<FormattedDropsProps> = ({ data }) => {
  return (
    <div className={styles.container}>
      {/* Game Info Section */}
      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>⏱️ Duration:</span>
          <span className={styles.infoValue}>{data.duration}</span>
        </div>
        {data.gameId && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>🎮 Game ID:</span>
            <span className={styles.infoValue}>{data.gameId}</span>
          </div>
        )}
        {data.sessionId && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>📊 Session:</span>
            <span className={styles.infoValue}>{data.sessionId}</span>
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className={styles.playersSection}>
        <h3 className={styles.sectionTitle}>
          👥 Players ({data.players.length})
        </h3>
        <div className={styles.playersList}>
          {data.players.map((player, index) => (
            <div key={index} className={styles.playerCard}>
              <div className={styles.playerHeader}>
                <span className={styles.playerName}>
                  {player.playerName}
                  {player.hasLuckyDrop && " 🍀"}
                </span>
                {player.className && (
                  <span className={styles.playerClass}>
                    ({player.className})
                  </span>
                )}
              </div>
              {player.items.length > 0 && (
                <div className={styles.itemsList}>
                  {player.items.map((item, itemIndex) => (
                    <div key={itemIndex} className={styles.itemRow}>
                      <span className={styles.itemBullet}>└</span>
                      <span className={styles.itemName}>
                        {item.itemName}
                        {item.isLucky && " 🍀"}
                      </span>
                      {item.className && (
                        <span className={styles.itemClass}>
                          ({item.className})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {player.items.length === 0 && (
                <div className={styles.noItems}>
                  <span className={styles.itemBullet}>└</span>
                  <span className={styles.noItemsText}>No drops this game</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormattedDrops;
