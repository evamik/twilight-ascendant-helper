import React, { useState } from "react";
import styles from "./CharacterData.module.css";

interface RawTextViewerProps {
  content: string;
}

/**
 * RawTextViewer Component
 * Displays expandable raw text content
 */
const RawTextViewer: React.FC<RawTextViewerProps> = ({ content }) => {
  const [showRawText, setShowRawText] = useState<boolean>(false);

  return (
    <div className={styles.rawTextSection}>
      <button
        onClick={() => setShowRawText(!showRawText)}
        className={styles.toggleButton}
      >
        {showRawText ? "▼" : "▶"} Raw Text Data
      </button>
      {showRawText && (
        <div className={styles.rawContent}>
          <pre className={styles.rawText}>{content}</pre>
        </div>
      )}
    </div>
  );
};

export default RawTextViewer;
