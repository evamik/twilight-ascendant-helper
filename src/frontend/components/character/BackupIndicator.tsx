import React from "react";

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
      <button
        onClick={onClose}
        style={{
          padding: "4px 12px",
          background: "#555",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        ← Back to Current
      </button>
    </div>
  );
};

export default BackupIndicator;
