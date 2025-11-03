import React from "react";
import styles from "./CharacterCard.module.css";
import { Button, IconButton } from "../common/buttons";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface CharacterCardProps {
  characterName: string;
  level: number;
  powerShards: number;
  accountName: string;
  isFavorite: boolean;
  tags: string[];
  availableTags: Tag[];
  buttonStyle?: React.CSSProperties;
  onCharacterClick: (characterName: string) => void;
  onLoad?: (characterName: string) => void;
  onToggleFavorite: (e: React.MouseEvent, characterName: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  characterName,
  level,
  powerShards,
  isFavorite,
  tags,
  availableTags,
  buttonStyle,
  onCharacterClick,
  onLoad,
  onToggleFavorite,
}) => {
  const heroIconPath = `./icons/heroes/${characterName}.png`;

  return (
    <button
      onClick={() => onCharacterClick(characterName)}
      className={styles.characterButton}
      style={buttonStyle}
    >
      {/* Icon and load button column */}
      <div className={styles.leftColumn}>
        <div className={styles.iconContainer}>
          <img
            src={heroIconPath}
            alt={characterName}
            className={styles.heroIcon}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            if (onLoad) {
              onLoad(characterName);
            } else {
              onCharacterClick(characterName);
            }
          }}
          variant="success"
          size="small"
          title={`Load ${characterName}`}
        >
          Load
        </Button>
      </div>

      {/* Content section with name, stats, and tags */}
      <div className={styles.contentSection}>
        <span className={styles.characterName}>{characterName}</span>

        {/* Character stats */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "4px",
            fontSize: "0.75rem",
            color: "#fff",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Level {level}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <img
              src="icons/general/shard.png"
              alt="Power Shards"
              style={{ width: "12px", height: "12px" }}
            />
            {powerShards.toLocaleString()}
          </span>
        </div>

        {/* Tag chips - visual only, no click events */}
        <div className={styles.tagsContainer}>
          {tags.map((tagId) => {
            const tag = availableTags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className={styles.tagChip}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Favorite button */}
      <IconButton
        onClick={(e) => onToggleFavorite(e, characterName)}
        variant="ghost"
        size="small"
        icon={isFavorite ? "⭐" : "☆"}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      />
    </button>
  );
};

export default CharacterCard;
