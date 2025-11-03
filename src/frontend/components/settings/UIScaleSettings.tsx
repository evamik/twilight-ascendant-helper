import React, { useState, useEffect } from "react";
import styles from "./UIScaleSettings.module.css";

const UIScaleSettings: React.FC = () => {
  const [mainAppScale, setMainAppScale] = useState<number>(1.0);
  const [overlayScale, setOverlayScale] = useState<number>(1.0);
  const [characterListScale, setCharacterListScale] = useState<number>(1.0);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: {
          invoke: (channel: string) => Promise<any>;
        };
      };

      // Load current scales
      Promise.all([
        ipcRenderer.invoke("get-main-app-scale"),
        ipcRenderer.invoke("get-overlay-scale"),
        ipcRenderer.invoke("get-character-list-scale"),
      ]).then(([mainScale, overlayScaleValue, characterListScaleValue]) => {
        setMainAppScale(mainScale);
        setOverlayScale(overlayScaleValue);
        setCharacterListScale(characterListScaleValue);
      });
    }
  }, []);

  const handleMainAppScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMainAppScale(parseFloat(e.target.value));
    setHasChanges(true);
  };

  const handleOverlayScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverlayScale(parseFloat(e.target.value));
    setHasChanges(true);
  };

  const handleCharacterListScaleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCharacterListScale(parseFloat(e.target.value));
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron") as {
        ipcRenderer: {
          invoke: (channel: string, ...args: any[]) => Promise<any>;
        };
      };

      Promise.all([
        ipcRenderer.invoke("set-main-app-scale", mainAppScale),
        ipcRenderer.invoke("set-overlay-scale", overlayScale),
        ipcRenderer.invoke("set-character-list-scale", characterListScale),
      ]).then(() => {
        setHasChanges(false);
        // Reload the page to apply main app and character list scale
        window.location.reload();
      });
    }
  };

  const handleReset = () => {
    setMainAppScale(1.0);
    setOverlayScale(1.0);
    setCharacterListScale(1.0);
    setHasChanges(true);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>UI Scale</h2>
      <p className={styles.description}>
        Adjust the UI scale for the main application and overlay separately.
      </p>

      <div className={styles.scaleControl}>
        <label className={styles.label}>
          Main Application Scale: {Math.round(mainAppScale * 100)}%
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={mainAppScale}
          onChange={handleMainAppScaleChange}
          className={styles.slider}
        />
      </div>

      <div className={styles.scaleControl}>
        <label className={styles.label}>
          Overlay Scale: {Math.round(overlayScale * 100)}%
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={overlayScale}
          onChange={handleOverlayScaleChange}
          className={styles.slider}
        />
      </div>

      <div className={styles.scaleControl}>
        <label className={styles.label}>
          Character List Scale: {Math.round(characterListScale * 100)}%
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={characterListScale}
          onChange={handleCharacterListScaleChange}
          className={styles.slider}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={handleSaveChanges}
          className={styles.saveButton}
          disabled={!hasChanges}
        >
          Save Changes
        </button>
        <button onClick={handleReset} className={styles.resetButton}>
          Reset to 100%
        </button>
      </div>

      <p className={styles.note}>
        Note: The main app will reload after saving to apply the new scale. The
        overlay scale will update immediately.
      </p>
    </div>
  );
};

export default UIScaleSettings;
