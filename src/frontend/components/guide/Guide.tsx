import React, { useState, useEffect } from "react";
import styles from "./Guide.module.css";

interface GuideProps {
  /** Optional URL to display. If not provided, shows the default guide overview */
  url?: string;
}

/**
 * Guide Component
 * Embeds the Twilight Ascendant community guide (Google Spreadsheet)
 */
const Guide: React.FC<GuideProps> = ({ url }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Default URL - guide overview
  const defaultUrl =
    "https://docs.google.com/spreadsheets/d/1uPRf7nsp50BpyAOMCu-cYtkEFwLY2NKAUcEa_PbIW00/view?rm=minimal&gid=1051526395#gid=1051526395";

  // Use provided URL or fall back to default
  const spreadsheetUrl = url || defaultUrl;

  const openInBrowser = () => {
    if (window.require) {
      const electron = window.require("electron");
      electron.shell.openExternal(spreadsheetUrl);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1.0);
  };

  // Handle keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Plus or Ctrl+= for zoom in
      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      }
      // Ctrl+Minus for zoom out
      else if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
      // Ctrl+0 for reset
      else if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        handleZoomReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>📚 Community Guide</h2>
          <div className={styles.infoBox}>
            <strong>ℹ️</strong> Guide by Avshar & Smurf
          </div>
        </div>
        <div className={styles.controls}>
          <div className={styles.zoomControls}>
            <button
              onClick={handleZoomOut}
              className={styles.zoomButton}
              title="Zoom Out (Ctrl + -)"
            >
              −
            </button>
            <span className={styles.zoomLevel}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className={styles.zoomButton}
              title="Zoom In (Ctrl + +)"
            >
              +
            </button>
            <button
              onClick={handleZoomReset}
              className={styles.resetButton}
              title="Reset Zoom (Ctrl + 0)"
            >
              Reset
            </button>
          </div>
          <button onClick={openInBrowser} className={styles.openButton}>
            🔗 Open in Browser
          </button>
        </div>
      </div>

      <div className={styles.iframeContainer} style={{ zoom: zoomLevel }}>
        <iframe
          src={spreadsheetUrl}
          className={styles.iframe}
          title="Twilight Ascendant Guide"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default Guide;
