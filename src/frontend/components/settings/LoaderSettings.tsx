import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import { Button } from "../common/buttons";
import styles from "./LoaderSettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface LoaderSettings {
  preloadMessages?: string[];
  postloadMessages?: string[];
}

interface SaveResult {
  success: boolean;
}

const LoaderSettings: React.FC = () => {
  const [preloadText, setPreloadText] = useState<string>("");
  const [postloadText, setPostloadText] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");

  // Load current settings on mount
  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer
        .invoke("get-loader-settings")
        .then((settings: LoaderSettings) => {
          setPreloadText((settings.preloadMessages || []).join("\n"));
          setPostloadText((settings.postloadMessages || []).join("\n"));
        });
    }
  }, []);

  const handleSavePreload = async () => {
    if (!ipcRenderer) return;

    // Split by newlines and filter out empty lines
    const messages = preloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = (await ipcRenderer.invoke(
      "set-preload-messages",
      messages
    )) as SaveResult;
    if (result.success) {
      setSaveStatus("Preload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const handleSavePostload = async () => {
    if (!ipcRenderer) return;

    // Split by newlines and filter out empty lines
    const messages = postloadText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result = (await ipcRenderer.invoke(
      "set-postload-messages",
      messages
    )) as SaveResult;
    if (result.success) {
      setSaveStatus("Postload messages saved!");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Loader Settings</h3>

      <div className={styles.section}>
        <label className={styles.label}>Preload Messages</label>
        <div className={styles.helpText}>
          Messages sent <strong>before</strong> the load command. One message
          per line. Each message will be sent with Enter before and after.
        </div>
        <textarea
          value={preloadText}
          onChange={(e) => setPreloadText(e.target.value)}
          placeholder="Enter messages (one per line)&#10;Example:&#10;Loading character...&#10;Please wait"
          className={styles.textarea}
        />
        <Button variant="success" size="medium" onClick={handleSavePreload}>
          Save Preload Messages
        </Button>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Postload Messages</label>
        <div className={styles.helpText}>
          Messages sent <strong>after</strong> the load command. One message per
          line. Each message will be sent with Enter before and after.
        </div>
        <textarea
          value={postloadText}
          onChange={(e) => setPostloadText(e.target.value)}
          placeholder="Enter messages (one per line)&#10;Example:&#10;Character loaded successfully!&#10;Ready to play"
          className={styles.textarea}
        />
        <Button variant="success" size="medium" onClick={handleSavePostload}>
          Save Postload Messages
        </Button>
      </div>

      {saveStatus && <div className={styles.successMessage}>{saveStatus}</div>}

      <div className={styles.infoBox}>
        <strong>How it works:</strong>
        <ul>
          <li>Each line is treated as a separate message</li>
          <li>Empty lines are ignored</li>
          <li>
            Messages are sent automatically:{" "}
            <code>Enter → Message → Enter</code>
          </li>
          <li>Preload messages are sent before the load code</li>
          <li>Postload messages are sent after the load code</li>
        </ul>
      </div>
    </div>
  );
};

export default LoaderSettings;
