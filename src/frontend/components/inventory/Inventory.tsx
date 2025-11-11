import React, { useState, useEffect } from "react";
import type { IpcRenderer } from "../../types/electron";
import FormattedInventory from "./FormattedInventory";
import styles from "./Inventory.module.css";
import { Button } from "../common/buttons";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface InventoryResult {
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
 * Inventory Component
 * Displays live inventory and stash data from inventory.txt
 * File updates every ~0.25s during gameplay
 */
const Inventory: React.FC = () => {
  const [inventoryContent, setInventoryContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialLoadComplete, setInitialLoadComplete] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load inventory content on mount
  useEffect(() => {
    loadInventory();
  }, []);

  // Listen for inventory file changes (updates every ~0.25s)
  useEffect(() => {
    if (!ipcRenderer) return;

    const handleInventoryFileChange = () => {
      loadInventory();
    };

    ipcRenderer.on("inventory-file-changed", handleInventoryFileChange);

    // Cleanup
    return () => {
      ipcRenderer.removeListener(
        "inventory-file-changed",
        handleInventoryFileChange
      );
    };
  }, [ipcRenderer]);

  const loadInventory = async () => {
    if (!ipcRenderer) {
      setError("IPC Renderer not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = (await ipcRenderer.invoke(
        "get-inventory"
      )) as InventoryResult;

      if (result.success) {
        setInventoryContent(result.content || null);
        if (result.message) {
          // File doesn't exist yet
          setError(null);
        }
      } else {
        setError(result.error || "Failed to load inventory");
      }
    } catch (err) {
      console.error("Error loading inventory:", err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleOpenInventoryDirectory = async () => {
    if (!ipcRenderer) return;

    try {
      const result = (await ipcRenderer.invoke(
        "open-inventory-directory"
      )) as OperationResult;

      if (!result.success) {
        console.error("Failed to open inventory directory:", result.error);
      }
    } catch (err) {
      console.error("Error opening inventory directory:", err);
    }
  };

  const handleRefresh = () => {
    loadInventory();
  };

  if (loading && !initialLoadComplete) {
    return <div className={styles.container}>Loading inventory...</div>;
  }

  if (error && !inventoryContent) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>Error: {error}</p>
        <Button onClick={handleRefresh} variant="primary" size="medium">
          Retry
        </Button>
      </div>
    );
  }

  if (!inventoryContent) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3>No Inventory Data</h3>
          <p>
            The inventory.txt file doesn't exist yet.
            <br />
            Load a character in-game to start tracking your inventory!
          </p>
          <div className={styles.buttonGroup}>
            <Button
              onClick={handleOpenInventoryDirectory}
              variant="secondary"
              size="medium"
            >
              Open Data Directory
            </Button>
            <Button onClick={handleRefresh} variant="primary" size="medium">
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2>Live Inventory</h2>
          <span className={styles.liveIndicator}>● LIVE</span>
        </div>
        <p className={styles.helpText}>
          💡 Drag and drop items to swap them in-game
        </p>
      </div>

      <FormattedInventory content={inventoryContent} />
    </div>
  );
};

export default Inventory;
