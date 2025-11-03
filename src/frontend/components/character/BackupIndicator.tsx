import React from "react";
import { Button } from "../common/buttons";

interface BackupIndicatorProps {
  fileName: string;
  onClose: () => void;
}

/**
 * BackupIndicator Component
 * Shows a banner when viewing a backup file
 */
const BackupIndicator: React.FC<BackupIndicatorProps> = ({
  fileName,
  onClose,
}) => {
  return (
    <div
      style={{
        background: "rgba(255, 165, 0, 0.2)",
        border: "1px solid #ffa500",
        borderRadius: "4px",
        padding: "8px 12px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ color: "#ffa500", fontWeight: "bold" }}>
        📂 Viewing Backup: {fileName}
      </span>
      <Button onClick={onClose} variant="secondary" size="small">
        ← Back to Current
      </Button>
    </div>
  );
};

export default BackupIndicator;
