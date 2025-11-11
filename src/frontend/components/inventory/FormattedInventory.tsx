import React, { useState } from "react";
import type { ParsedLoaderData, InventorySlot } from "../../utils/loaderParser";
import { parseLoaderContent } from "../../utils/loaderParser";
import type { IpcRenderer } from "../../types/electron";
import {
  calculateSwapCommands,
  type ItemLocation,
} from "../../utils/inventorySwapper";
import BuildManager from "./BuildManager";
import styles from "./FormattedInventory.module.css";

const { ipcRenderer } = (window.require ? window.require("electron") : {}) as {
  ipcRenderer?: IpcRenderer;
};

interface FormattedInventoryProps {
  content: string;
}

/**
 * FormattedInventory Component
 * Displays inventory data with drag-and-drop item swapping
 */
const FormattedInventory: React.FC<FormattedInventoryProps> = ({ content }) => {
  const [draggedItem, setDraggedItem] = useState<{
    location: ItemLocation;
    itemName: string;
  } | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Parse the inventory content
  const data: ParsedLoaderData | null = parseLoaderContent(content);

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Unable to parse inventory data. The file format may be invalid.
        </div>
      </div>
    );
  }

  /**
   * Handle drag start
   */
  const handleDragStart = (location: ItemLocation, itemName: string) => {
    setDraggedItem({ location, itemName });
  };

  /**
   * Handle drop
   */
  const handleDrop = async (toLocation: ItemLocation) => {
    if (!draggedItem || !ipcRenderer) return;

    const fromLocation = draggedItem.location;

    // Don't swap if same location
    if (
      fromLocation.type === toLocation.type &&
      ((fromLocation.type === "inventory" &&
        toLocation.type === "inventory" &&
        fromLocation.slot === toLocation.slot) ||
        (fromLocation.type === "stash" &&
          toLocation.type === "stash" &&
          fromLocation.stashNumber === toLocation.stashNumber &&
          fromLocation.slot === toLocation.slot))
    ) {
      setDraggedItem(null);
      return;
    }

    setIsSwapping(true);

    try {
      const commands = calculateSwapCommands(fromLocation, toLocation, data);

      if (commands.length === 0) {
        alert("Cannot perform this swap");
        return;
      }

      const result = await ipcRenderer.invoke(
        "send-inventory-commands",
        commands
      );

      if (!result.success) {
        alert(`Failed to swap items: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error swapping items:", error);
      alert("Failed to swap items");
    } finally {
      setIsSwapping(false);
      setDraggedItem(null);
    }
  };

  // Helper function to render all 6 slots (including empty ones)
  const renderAllSlots = (
    items: InventorySlot[],
    location: "inventory" | { stashNumber: number }
  ) => {
    const maxSlots = 6;
    const slots = [];
    for (let i = 1; i <= maxSlots; i++) {
      const item = items.find((item) => item.slot === i);
      const itemLocation: ItemLocation =
        location === "inventory"
          ? { type: "inventory", slot: i }
          : { type: "stash", stashNumber: location.stashNumber, slot: i };

      const isDragging =
        draggedItem &&
        draggedItem.location.type === itemLocation.type &&
        ((itemLocation.type === "inventory" &&
          draggedItem.location.type === "inventory" &&
          draggedItem.location.slot === i) ||
          (itemLocation.type === "stash" &&
            draggedItem.location.type === "stash" &&
            draggedItem.location.stashNumber === itemLocation.stashNumber &&
            draggedItem.location.slot === i));

      slots.push(
        <div
          key={i}
          className={`${item ? styles.itemSlot : styles.emptySlot} ${
            isDragging ? styles.dragging : ""
          } ${isSwapping ? styles.disabled : ""}`}
          title={item ? item.itemName : "Empty slot"}
          draggable={!!item && !isSwapping}
          onDragStart={(e) => {
            if (item) {
              handleDragStart(itemLocation, item.itemName);
              // Store item name in dataTransfer for BuildManager
              e.dataTransfer.setData("itemName", item.itemName);
              e.dataTransfer.effectAllowed = "copyMove";
            }
          }}
          onDragOver={(e) => {
            if (!isSwapping) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!isSwapping) handleDrop(itemLocation);
          }}
        >
          {item ? (
            <span className={styles.itemName}>{item.itemName}</span>
          ) : (
            <span className={styles.emptySlotText}>—</span>
          )}
        </div>
      );
    }
    return slots;
  };

  return (
    <div className={styles.container}>
      {isSwapping && (
        <div className={styles.swappingOverlay}>
          <div className={styles.swappingMessage}>Swapping items...</div>
        </div>
      )}

      {/* Build Manager */}
      <BuildManager data={data} />

      {/* Cards Grid Container - Inventory and Stashes */}
      <div className={styles.cardsGrid}>
        {/* Inventory Card */}
        <div className={styles.inventoryCard}>
          <h3 className={styles.cardTitle}>
            🎒 Inventory ({data.inventory.length}/6)
          </h3>
          <div className={styles.itemsGrid}>
            {renderAllSlots(data.inventory, "inventory")}
          </div>
        </div>

        {/* Stash Cards */}
        {data.stashes.map((stash) => (
          <div key={stash.stashNumber} className={styles.stashCard}>
            <h3 className={styles.cardTitle}>
              📦 Stash {stash.stashNumber} ({stash.items.length}/6)
            </h3>
            <div className={styles.itemsGrid}>
              {renderAllSlots(stash.items, { stashNumber: stash.stashNumber })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormattedInventory;
