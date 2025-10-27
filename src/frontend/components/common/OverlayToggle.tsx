/**
 * OverlayToggle Component
 * Manages overlay enabled state with IPC communication
 * Separated from index.tsx to maintain SRP
 */

import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import styles from "./OverlayToggle.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface UISettings {
  overlayEnabled?: boolean;
}

const OverlayToggle: React.FC = () => {
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Load overlay enabled state from settings on mount
  useEffect(() => {
    const loadUISettings = async () => {
      if (!ipcRenderer) return;

      try {
        const uiSettings = (await ipcRenderer.invoke(
          "get-ui-settings"
        )) as UISettings;
        if (uiSettings.overlayEnabled !== undefined) {
          setOverlayEnabled(uiSettings.overlayEnabled);
          // Backend already loaded this state on startup, so no need to send toggle-overlay here
          // Just sync the UI checkbox state
        }
      } catch (error) {
        console.error("Error loading UI settings:", error);
      }
    };

    loadUISettings();
  }, []);

  // Auto-dismiss status message after 2 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(""), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [statusMessage]);

  const handleOverlayToggle = async (checked: boolean) => {
    setOverlayEnabled(checked);
    if (ipcRenderer) {
      ipcRenderer.send("toggle-overlay", checked);
      // Save preference
      try {
        await ipcRenderer.invoke("set-overlay-enabled", checked);
      } catch (error) {
        console.error("Error saving overlay preference:", error);
      }
    }
  };

  const handleResetOverlay = async () => {
    if (!ipcRenderer) return;

    const confirmed = window.confirm(
      "Reset overlay position and size to defaults?"
    );
    if (!confirmed) return;

    try {
      const success = (await ipcRenderer.invoke(
        "reset-overlay-position-size"
      )) as boolean;
      if (success) {
        setStatusMessage("✓ Overlay reset to defaults");
      } else {
        setStatusMessage("✗ Failed to reset overlay");
      }
    } catch (error) {
      console.error("Error resetting overlay:", error);
      setStatusMessage("✗ Error resetting overlay");
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={overlayEnabled}
          onChange={(e) => handleOverlayToggle(e.target.checked)}
          className={styles.checkbox}
        />
        <span>Enable Overlay</span>
      </label>
      <button onClick={handleResetOverlay} className={styles.resetButton}>
        Reset Overlay Position & Size
      </button>
      {statusMessage && (
        <div className={styles.statusMessage}>{statusMessage}</div>
      )}
    </div>
  );
};

export default OverlayToggle;
