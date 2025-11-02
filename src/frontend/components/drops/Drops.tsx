import React, { useState, useEffect, useMemo } from "react";
import type { IpcRenderer } from "../../types/electron";
import FormattedDrops from "./FormattedDrops";
import { parseDropsContent } from "../../utils/dropsParser";
import styles from "./Drops.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface DropsResult {
  success: boolean;
  content?: string;
  lastModified?: string;
  message?: string;
  error?: string;
}

interface OperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Drops Component
 * Displays the content of drops.txt file from the Twilight Ascendant data directory
 */
const Drops: React.FC = () => {
  const [dropsContent, setDropsContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoadComplete, setInitialLoadComplete] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [copyingReplay, setCopyingReplay] = useState<boolean>(false);
  const [replayCopyStatus, setReplayCopyStatus] = useState<string>("");
  const [showRawText, setShowRawText] = useState<boolean>(false);

  // Parse drops content into structured data
  const parsedData = useMemo(() => {
    if (!dropsContent) return null;
    return parseDropsContent(dropsContent);
  }, [dropsContent]);

  // Load drops content on mount
  useEffect(() => {
    loadDrops();
  }, []);

  // Listen for drops file changes
  useEffect(() => {
    if (!ipcRenderer) return;

    const handleDropsFileChange = () => {
      console.log("[Drops] File changed, reloading...");
      loadDrops();
    };

    ipcRenderer.on("drops-file-changed", handleDropsFileChange);

    // Cleanup
    return () => {
      ipcRenderer.removeListener("drops-file-changed", handleDropsFileChange);
    };
  }, [ipcRenderer]);

  const loadDrops = async () => {
    if (!ipcRenderer) {
      setError("IPC Renderer not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = (await ipcRenderer.invoke("get-drops")) as DropsResult;

      if (result.success) {
        setDropsContent(result.content || null);
        setLastModified(result.lastModified || null);
        if (result.message) {
          // File doesn't exist yet
          setError(null);
        }
      } else {
        setError(result.error || "Failed to load drops");
      }
    } catch (err) {
      console.error("Error loading drops:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleString();
  };

  const openDirectory = async () => {
    if (!ipcRenderer) return;

    try {
      const result = (await ipcRenderer.invoke(
        "open-drops-directory"
      )) as OperationResult;
      if (!result.success) {
        console.error("Failed to open directory:", result.error);
      }
    } catch (err) {
      console.error("Error opening directory:", err);
    }
  };

  const copyReplay = async () => {
    if (!ipcRenderer) return;

    try {
      setCopyingReplay(true);
      setReplayCopyStatus("");

      const result = (await ipcRenderer.invoke(
        "copy-latest-replay"
      )) as OperationResult;

      if (result.success) {
        setReplayCopyStatus(`✓ ${result.message}`);
        setTimeout(() => setReplayCopyStatus(""), 5000);
      } else {
        setReplayCopyStatus(`✗ ${result.error}`);
        setTimeout(() => setReplayCopyStatus(""), 5000);
      }
    } catch (err) {
      console.error("Error copying replay:", err);
      setReplayCopyStatus(`✗ ${(err as Error).message}`);
      setTimeout(() => setReplayCopyStatus(""), 5000);
    } finally {
      setCopyingReplay(false);
    }
  };

  // Don't render until initial load is complete to prevent layout shifts
  if (!initialLoadComplete) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📦 Drops Tracker</h2>
        <div className={styles.buttonGroup}>
          <button
            onClick={copyReplay}
            disabled={copyingReplay}
            className={
              copyingReplay
                ? styles.copyReplayButtonDisabled
                : styles.copyReplayButton
            }
          >
            <span className={styles.buttonIcon}>
              {copyingReplay ? "⏳" : "🎮"}
            </span>
            <span className={styles.buttonLabel}>
              {copyingReplay ? "Copying..." : "Copy Replay"}
            </span>
          </button>
          <button onClick={openDirectory} className={styles.openExplorerButton}>
            <span className={styles.buttonIcon}>📂</span>
            <span className={styles.buttonLabel}>Open in Explorer</span>
          </button>
          <button
            onClick={loadDrops}
            disabled={loading}
            className={
              loading ? styles.refreshButtonDisabled : styles.refreshButton
            }
          >
            <span className={styles.buttonIcon}>{loading ? "⏳" : "🔄"}</span>
            <span className={styles.buttonLabel}>
              {loading ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {replayCopyStatus && (
        <div
          className={
            replayCopyStatus.includes("✓") ? styles.success : styles.error
          }
        >
          {replayCopyStatus}
        </div>
      )}

      {lastModified && (
        <p className={styles.lastModified}>
          Last updated: {formatDate(lastModified)}
        </p>
      )}

      {error && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && !dropsContent && (
        <div className={styles.loadingMessage}>Loading drops...</div>
      )}

      {!loading && !dropsContent && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📦</div>
          <h3 className={styles.emptyStateTitle}>No Drops Tracked Yet</h3>
          <p className={styles.emptyStateText}>
            The drops.txt file doesn't exist yet.
            <br />
            Start playing Twilight Ascendant to track your drops!
          </p>
        </div>
      )}

      {!loading && dropsContent && (
        <>
          {parsedData && (
            <div className={styles.formattedSection}>
              <FormattedDrops data={parsedData} />
            </div>
          )}

          <div className={styles.rawTextSection}>
            <button
              onClick={() => setShowRawText(!showRawText)}
              className={styles.toggleButton}
            >
              {showRawText ? "▼" : "▶"} Raw Text Data
            </button>
            {showRawText && (
              <div className={styles.dropsContent}>
                <pre className={styles.dropsText}>{dropsContent}</pre>
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.infoBox}>
        <strong>ℹ️ Info:</strong> Drops are tracked in the{" "}
        <code>drops.txt</code> file in your Twilight Ascendant data directory.
        The file updates automatically as you play.
        <br />
        <br />
        <strong>🎮 Copy Replay:</strong> Copies your latest{" "}
        <code>LastReplay.w3g</code> to this directory (replaces the previous
        copy), making it easy to share both drops and replay to Discord!
        Configure the replay directory in Settings if needed.
      </div>
    </div>
  );
};

export default Drops;
