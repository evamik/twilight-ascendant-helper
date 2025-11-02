import React from "react";
import styles from "./CharacterCard.module.css";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface CharacterCardProps {
  characterName: string;
  accountName: string;
  isFavorite: boolean;
  tags: string[];
  availableTags: Tag[];
  buttonStyle?: React.CSSProperties;
  onCharacterClick: (characterName: string) => void;
  onToggleFavorite: (e: React.MouseEvent, characterName: string) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  characterName,
  isFavorite,
  tags,
  availableTags,
  buttonStyle,
  onCharacterClick,
  onToggleFavorite,
}) => {
  const heroIconPath = `./icons/heroes/${characterName}.png`;

  return (
    <button
      onClick={() => onCharacterClick(characterName)}
      className={styles.characterButton}
      style={buttonStyle}
    >
      {/* Icon container - always reserves space */}
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

      {/* Content section with name and tags */}
      <div className={styles.contentSection}>
        <span className={styles.characterName}>{characterName}</span>

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
      <button
        onClick={(e) => onToggleFavorite(e, characterName)}
        className={styles.favoriteButton}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorite ? "⭐" : "☆"}
      </button>
    </button>
  );
};

export default CharacterCard;
