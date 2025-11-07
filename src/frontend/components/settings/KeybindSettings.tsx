import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import { Button } from "../common/buttons";
import styles from "./KeybindSettings.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface SaveResult {
  success: boolean;
}

const KeybindSettings: React.FC = () => {
  const [keybind, setKeybind] = useState<string>("Alt+O");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Load current keybind on mount
  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer
        .invoke("get-overlay-toggle-keybind")
        .then((savedKeybind: string) => {
          setKeybind(savedKeybind);
        })
        .catch((error: any) => {
          console.error("Error loading keybind:", error);
        });

      // Notify main process that settings page is open
      // This prevents dynamic keybind registration while we're configuring
      ipcRenderer.send("keybind-settings-opened");
    }

    return () => {
      // Notify main process that settings page is closed
      if (ipcRenderer) {
        ipcRenderer.send("keybind-settings-closed");
      }
    };
  }, []);

  // Handle key recording - only when recording is active
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Build keybind string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      // Get the key name
      let key = e.key;

      // Map special keys
      if (key === " ") key = "Space";
      else if (
        key === "Control" ||
        key === "Alt" ||
        key === "Shift" ||
        key === "Meta"
      ) {
        // Don't allow modifier-only keybinds
        return;
      }

      // Capitalize single letters
      if (key.length === 1) {
        key = key.toUpperCase();
      }

      parts.push(key);

      const newKeybind = parts.join("+");
      setKeybind(newKeybind);
      setIsRecording(false);
    };

    // Add listener only while recording
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      // Clean up when recording stops
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecording]); // Re-run when isRecording changes

  const handleStartRecording = () => {
    setIsRecording(true);
    setStatusMessage("Press any key combination...");
  };

  const handleSave = async () => {
    if (!ipcRenderer) return;

    try {
      setStatusMessage("Saving...");
      const result = (await ipcRenderer.invoke(
        "set-overlay-toggle-keybind",
        keybind
      )) as SaveResult;

      if (result.success) {
        // Notify main process to re-register keybind
        ipcRenderer.send("keybind-changed");
        setStatusMessage("✓ Keybind saved successfully");
        setTimeout(() => setStatusMessage(""), 2000);
      } else {
        setStatusMessage("✗ Failed to save keybind");
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (error) {
      console.error("Error saving keybind:", error);
      setStatusMessage("✗ Error saving keybind");
      setTimeout(() => setStatusMessage(""), 2000);
    }
  };

  const handleReset = async () => {
    const defaultKeybind = "Alt+O";
    setKeybind(defaultKeybind);

    if (!ipcRenderer) return;

    try {
      const result = (await ipcRenderer.invoke(
        "set-overlay-toggle-keybind",
        defaultKeybind
      )) as SaveResult;

      if (result.success) {
        // Notify main process to re-register keybind
        ipcRenderer.send("keybind-changed");
        setStatusMessage("✓ Reset to default");
        setTimeout(() => setStatusMessage(""), 2000);
      }
    } catch (error) {
      console.error("Error resetting keybind:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Overlay Toggle Keybind</h3>
      <p className={styles.description}>
        Set a keybind to expand/minimize the overlay window
      </p>

      <div className={styles.keybindRow}>
        <div className={styles.keybindDisplay}>
          {isRecording ? (
            <span className={styles.recording}>Recording...</span>
          ) : (
            <span className={styles.keybind}>{keybind}</span>
          )}
        </div>

        <Button
          variant="info"
          size="medium"
          onClick={handleStartRecording}
          disabled={isRecording}
        >
          {isRecording ? "Press Key..." : "Change"}
        </Button>

        <Button variant="success" size="medium" onClick={handleSave}>
          Save
        </Button>

        <Button variant="danger" size="medium" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {statusMessage && (
        <div className={styles.statusMessage}>{statusMessage}</div>
      )}

      <div className={styles.hint}>
        💡 Keybind is only active when Warcraft III or the helper app is
        focused.
        <br />
        It will NOT interfere with other applications like File Explorer,
        browsers, etc.
      </div>
    </div>
  );
};

export default KeybindSettings;
