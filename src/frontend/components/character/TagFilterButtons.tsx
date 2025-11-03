import React from "react";
import styles from "./TagFilterButtons.module.css";
import { Button } from "../common/buttons";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagFilterButtonsProps {
  availableTags: Tag[];
  selectedTagFilters: Set<string>;
  showFavoritesOnly: boolean;
  onToggleTag: (tagId: string) => void;
  onToggleFavorites: () => void;
  onClearAll: () => void;
}

const TagFilterButtons: React.FC<TagFilterButtonsProps> = ({
  availableTags,
  selectedTagFilters,
  showFavoritesOnly,
  onToggleTag,
  onToggleFavorites,
  onClearAll,
}) => {
  return (
    <div className={styles.tagFilterGrid}>
      {/* Show All button */}
      <Button
        onClick={onClearAll}
        variant={
          selectedTagFilters.size === 0 && !showFavoritesOnly
            ? "primary"
            : "secondary"
        }
        className={styles.tagFilterButton}
      >
        Show All
      </Button>

      {/* Favorites filter button */}
      <Button
        onClick={onToggleFavorites}
        variant={showFavoritesOnly ? "primary" : "secondary"}
        className={styles.tagFilterButton}
        style={
          showFavoritesOnly
            ? {
                backgroundColor: "#ffc107",
              }
            : undefined
        }
      >
        ⭐ Favorites
      </Button>

      {/* Individual tag buttons */}
      {availableTags.map((tag) => {
        const isActive = selectedTagFilters.has(tag.id);
        return (
          <Button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            variant={isActive ? "primary" : "secondary"}
            className={styles.tagFilterButton}
            style={
              isActive
                ? {
                    backgroundColor: tag.color,
                  }
                : undefined
            }
          >
            {tag.name}
          </Button>
        );
      })}
    </div>
  );
};

export default TagFilterButtons;
