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

  return (
    <label className={styles.label}>
      <input
        type="checkbox"
        checked={overlayEnabled}
        onChange={(e) => handleOverlayToggle(e.target.checked)}
        className={styles.checkbox}
      />
      <span>Enable Overlay</span>
    </label>
  );
};

export default OverlayToggle;
