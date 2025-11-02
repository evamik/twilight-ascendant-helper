import React from "react";
import styles from "./TagFilterButtons.module.css";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagFilterButtonsProps {
  availableTags: Tag[];
  selectedTagFilters: Set<string>;
  onToggleTag: (tagId: string) => void;
  onClearAll: () => void;
}

const TagFilterButtons: React.FC<TagFilterButtonsProps> = ({
  availableTags,
  selectedTagFilters,
  onToggleTag,
  onClearAll,
}) => {
  return (
    <div className={styles.tagFilterGrid}>
      {/* Show All button */}
      <button
        onClick={onClearAll}
        className={`${styles.tagFilterButton} ${
          selectedTagFilters.size === 0 ? styles.tagFilterActive : ""
        }`}
      >
        Show All
      </button>

      {/* Individual tag buttons */}
      {availableTags.map((tag) => {
        const isActive = selectedTagFilters.has(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onToggleTag(tag.id)}
            className={`${styles.tagFilterButton} ${
              isActive ? styles.tagFilterActive : ""
            }`}
            style={
              isActive
                ? {
                    backgroundColor: tag.color,
                  }
                : undefined
            }
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};

export default TagFilterButtons;
