import React, { useState } from "react";
import styles from "./CharacterData.module.css";
import { Button } from "../common/buttons";

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
      <Button
        onClick={() => setShowRawText(!showRawText)}
        variant="ghost"
        className={styles.toggleButton}
      >
        {showRawText ? "▼" : "▶"} Raw Text Data
      </Button>
      {showRawText && (
        <div className={styles.rawContent}>
          <pre className={styles.rawText}>{content}</pre>
        </div>
      )}
    </div>
  );
};

export default RawTextViewer;
