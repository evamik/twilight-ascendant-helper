import React, { useState, useEffect } from "react";
import type { Build } from "../../types/builds";
import type { ParsedLoaderData } from "../../utils/loaderParser";
import { generateBuildSwapCommands } from "../../utils/buildSwapper";
import type { IpcRenderer } from "../../types/electron";
import styles from "./BuildManager.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface BuildManagerProps {
  data: ParsedLoaderData;
}

const BuildManager: React.FC<BuildManagerProps> = ({ data }) => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    itemName: string;
    fromSlot?: number; // If dragging from build, track which slot
  } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load builds from localStorage
  useEffect(() => {
    const savedBuilds = localStorage.getItem("inventoryBuilds");
    if (savedBuilds) {
      const parsed = JSON.parse(savedBuilds);
      setBuilds(parsed);
      if (parsed.length > 0 && !selectedBuildId) {
        setSelectedBuildId(parsed[0].id);
      }
    }
  }, []);

  // Save builds to localStorage whenever they change
  useEffect(() => {
    if (builds.length > 0) {
      localStorage.setItem("inventoryBuilds", JSON.stringify(builds));
    }
  }, [builds]);

  const selectedBuild = builds.find((b) => b.id === selectedBuildId);

  const exportDebugData = () => {
    const debugData = {
      builds,
      currentInventory: data.inventory,
      stashes: data.stashes,
      timestamp: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(debugData, null, 2);
    navigator.clipboard.writeText(jsonString);
    console.log("Debug data copied to clipboard:", debugData);
  };

  const createNewBuild = () => {
    const newBuild: Build = {
      id: `build_${Date.now()}`,
      name: `Build ${builds.length + 1}`,
      slots: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setBuilds([...builds, newBuild]);
    setSelectedBuildId(newBuild.id);
  };

  const deleteBuild = () => {
    if (!selectedBuildId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!selectedBuildId) return;

    const newBuilds = builds.filter((b) => b.id !== selectedBuildId);
    setBuilds(newBuilds);
    setSelectedBuildId(newBuilds.length > 0 ? newBuilds[0].id : null);
    setShowDeleteConfirm(false);
  };

  const renameBuild = () => {
    if (!selectedBuild) return;
    setRenameInput(selectedBuild.name);
    setShowRenameModal(true);
  };

  const confirmRename = () => {
    if (!renameInput.trim()) return;

    setBuilds(
      builds.map((b) =>
        b.id === selectedBuildId
          ? { ...b, name: renameInput.trim(), updatedAt: Date.now() }
          : b
      )
    );
    setShowRenameModal(false);
    setRenameInput(""); // Reset input
  };

  const cancelRename = () => {
    setShowRenameModal(false);
    setRenameInput(""); // Reset input
  };

  const handleDragStart = (itemName: string, fromSlot?: number) => {
    setDraggedItem({ itemName, fromSlot });
  };

  const handleDropOnBuildSlot = (targetSlot: number, e: React.DragEvent) => {
    e.preventDefault();

    // Get item name from dataTransfer (from inventory/stash drag)
    const itemNameFromTransfer = e.dataTransfer.getData("itemName");
    const itemName = itemNameFromTransfer || draggedItem?.itemName;

    if (!itemName || !selectedBuild) return;

    // Remove item from old slot if dragging within build
    let newSlots = selectedBuild.slots.filter(
      (s) => s.slot !== draggedItem?.fromSlot
    );

    // Remove any item currently in target slot
    newSlots = newSlots.filter((s) => s.slot !== targetSlot);

    // Add item to new slot
    newSlots.push({
      slot: targetSlot,
      itemName: itemName,
    });

    setBuilds(
      builds.map((b) =>
        b.id === selectedBuildId
          ? { ...b, slots: newSlots, updatedAt: Date.now() }
          : b
      )
    );

    setDraggedItem(null);
  };

  const removeItemFromSlot = (slot: number) => {
    if (!selectedBuild) return;

    const newSlots = selectedBuild.slots.filter((s) => s.slot !== slot);
    setBuilds(
      builds.map((b) =>
        b.id === selectedBuildId
          ? { ...b, slots: newSlots, updatedAt: Date.now() }
          : b
      )
    );
  };

  const applyBuild = async () => {
    if (!selectedBuild || !ipcRenderer) return;

    setIsApplying(true);

    try {
      // Deep clone data to avoid modifying original
      const dataCopy = JSON.parse(JSON.stringify(data));

      const commands = generateBuildSwapCommands(selectedBuild, dataCopy);

      if (commands.length === 0) {
        console.log("Build is already applied or no changes needed");
        return;
      }

      console.log(`Applying build with ${commands.length} commands:`, commands);

      const result = await ipcRenderer.invoke(
        "send-inventory-commands",
        commands
      );

      if (!result.success) {
        console.error(
          `Failed to apply build: ${result.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error applying build:", error);
    } finally {
      setIsApplying(false);
    }
  };

  // Render build slots (1-6)
  const renderBuildSlots = () => {
    const slots = [];
    for (let i = 1; i <= 6; i++) {
      const slotItem = selectedBuild?.slots.find((s) => s.slot === i);

      slots.push(
        <div
          key={i}
          className={
            slotItem
              ? styles.buildSlot
              : `${styles.buildSlot} ${styles.emptyBuildSlot}`
          }
          draggable={!!slotItem}
          onDragStart={(e) => {
            if (slotItem) {
              handleDragStart(slotItem.itemName, i);
              e.dataTransfer.setData("itemName", slotItem.itemName);
              e.dataTransfer.effectAllowed = "move";
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            handleDropOnBuildSlot(i, e);
          }}
        >
          <span className={styles.slotNumber}>{i}</span>
          {slotItem ? (
            <>
              <span className={styles.itemName}>{slotItem.itemName}</span>
              <button
                className={styles.removeButton}
                onClick={() => removeItemFromSlot(i)}
                title="Remove item"
              >
                ×
              </button>
            </>
          ) : (
            <span className={styles.emptySlotText}>Drop item here</span>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className={styles.container}>
      {isApplying && (
        <div className={styles.applyingOverlay}>
          <div className={styles.applyingMessage}>Applying build...</div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className={styles.modal} onClick={cancelRename}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Rename Build</h3>
            <input
              type="text"
              className={styles.modalInput}
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRename();
                if (e.key === "Escape") cancelRename();
              }}
              autoFocus
              placeholder="Enter build name"
            />
            <div className={styles.modalButtons}>
              <button className={styles.button} onClick={cancelRename}>
                Cancel
              </button>
              <button className={styles.button} onClick={confirmRename}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className={styles.modal}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Delete Build</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete "
              <strong>{selectedBuild?.name}</strong>"?
              <br />
              This action cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={styles.button}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.deleteButton}`}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>⚔️ Builds</h2>
        <div className={styles.buildSelector}>
          {builds.length > 0 && (
            <select
              className={styles.select}
              value={selectedBuildId || ""}
              onChange={(e) => setSelectedBuildId(e.target.value)}
            >
              {builds.map((build) => (
                <option key={build.id} value={build.id}>
                  {build.name} ({build.slots.length}/6)
                </option>
              ))}
            </select>
          )}
          <button className={styles.button} onClick={createNewBuild}>
            + New Build
          </button>
          {selectedBuild && (
            <>
              <button className={styles.button} onClick={renameBuild}>
                Rename
              </button>
              <button
                className={`${styles.button} ${styles.deleteButton}`}
                onClick={deleteBuild}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {selectedBuild ? (
        <div className={styles.buildEditor}>
          <div className={styles.buildSlots}>{renderBuildSlots()}</div>

          <div className={styles.buildActions}>
            <div className={styles.helpIcon}>
              ?
              <div className={styles.tooltip}>
                Drag items from inventory/stashes to build slots, then click
                Apply Build
              </div>
            </div>
            <button
              className={`${styles.button} ${styles.applyButton}`}
              onClick={applyBuild}
              disabled={isApplying || selectedBuild.slots.length === 0}
            >
              Apply Build to Inventory
            </button>
            {process.env.NODE_ENV === "development" && (
              <button
                className={styles.button}
                onClick={exportDebugData}
                title="Copy builds and inventory data to clipboard for debugging"
              >
                📋 Export Debug Data
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.noBuild}>
          Click "New Build" to create your first build
        </div>
      )}
    </div>
  );
};

export default BuildManager;
