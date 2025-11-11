/**
 * Build swapper - generates commands to swap current inventory with a build
 */

import type { ParsedLoaderData } from "./loaderParser";
import type { Build } from "../types/builds";
import { calculateSwapCommands, type ItemLocation } from "./inventorySwapper";

/**
 * Simulate executing a single game command on the data state
 */
function simulateCommand(command: string, data: ParsedLoaderData): void {
  const stashMatch = command.match(/^-s(\d+) (\d+)$/);
  const getMatch = command.match(/^-g(\d+) (\d+)$/);
  const swapMatch = command.match(/^-w(\d+) (\d+)$/);

  if (stashMatch) {
    // -sX Y: Move inventory slot Y to first available in stash X
    const stashNum = parseInt(stashMatch[1]);
    const invSlot = parseInt(stashMatch[2]);
    const invItem = data.inventory.find((item) => item.slot === invSlot);

    if (invItem) {
      // Find first empty slot in target stash
      const stash = data.stashes.find((s) => s.stashNumber === stashNum);
      if (stash) {
        for (let slot = 1; slot <= 6; slot++) {
          if (!stash.items.find((item) => item.slot === slot)) {
            stash.items.push({ slot, itemName: invItem.itemName });
            data.inventory = data.inventory.filter(
              (item) => item.slot !== invSlot
            );
            break;
          }
        }
      }
    }
  } else if (getMatch) {
    // -gX Y: Get stash X slot Y to first available inventory
    const stashNum = parseInt(getMatch[1]);
    const stashSlot = parseInt(getMatch[2]);
    const stash = data.stashes.find((s) => s.stashNumber === stashNum);
    const stashItem = stash?.items.find((item) => item.slot === stashSlot);

    if (stashItem && stash) {
      // Find first empty inventory slot
      for (let slot = 1; slot <= 6; slot++) {
        if (!data.inventory.find((item) => item.slot === slot)) {
          data.inventory.push({ slot, itemName: stashItem.itemName });
          stash.items = stash.items.filter((item) => item.slot !== stashSlot);
          break;
        }
      }
    }
  } else if (swapMatch) {
    // -wX Y: Swap inventory slot Y with stash X slot Y (same slot number)
    const stashNum = parseInt(swapMatch[1]);
    const slot = parseInt(swapMatch[2]);
    const invItem = data.inventory.find((item) => item.slot === slot);
    const stash = data.stashes.find((s) => s.stashNumber === stashNum);
    const stashItem = stash?.items.find((item) => item.slot === slot);

    if (invItem && stashItem) {
      // Both exist - swap names
      const tempName = invItem.itemName;
      invItem.itemName = stashItem.itemName;
      stashItem.itemName = tempName;
    } else if (invItem && stash) {
      // Only inv exists - move to stash
      stash.items.push({ slot, itemName: invItem.itemName });
      data.inventory = data.inventory.filter((item) => item.slot !== slot);
    } else if (stashItem && stash) {
      // Only stash exists - move to inv
      data.inventory.push({ slot, itemName: stashItem.itemName });
      stash.items = stash.items.filter((item) => item.slot !== slot);
    }
  }
}

/**
 * Find where an item is located (inventory or stash)
 */
function findItemLocation(
  itemName: string,
  data: ParsedLoaderData
): ItemLocation | null {
  // Check inventory
  const invItem = data.inventory.find((item) => item.itemName === itemName);
  if (invItem) {
    return { type: "inventory", slot: invItem.slot };
  }

  // Check all stashes
  for (const stash of data.stashes) {
    const stashItem = stash.items.find((item) => item.itemName === itemName);
    if (stashItem) {
      return {
        type: "stash",
        stashNumber: stash.stashNumber,
        slot: stashItem.slot,
      };
    }
  }

  return null;
}

/**
 * Generate commands to apply a build to current inventory
 * Strategy:
 * 1. For each build slot, find where that item currently is (based on simulated state)
 * 2. Generate swap commands using a SNAPSHOT to avoid temp slot conflicts
 * 3. Simulate commands to track where items end up for next lookup
 */
export function generateBuildSwapCommands(
  build: Build,
  data: ParsedLoaderData
): string[] {
  const allCommands: string[] = [];

  // Create a map of target slot -> item name from build
  const buildMap = new Map<number, string>();
  for (const buildSlot of build.slots) {
    buildMap.set(buildSlot.slot, buildSlot.itemName);
  }

  // Process each inventory slot (1-6)
  for (let slot = 1; slot <= 6; slot++) {
    const targetItemName = buildMap.get(slot);
    const currentItem = data.inventory.find((item) => item.slot === slot);

    // If build wants this slot empty and it's already empty, skip
    if (!targetItemName && !currentItem) {
      continue;
    }

    // If build wants this slot empty but it has an item
    if (!targetItemName && currentItem) {
      const emptyStashSlot = findFirstEmptyStashSlot(data);
      if (emptyStashSlot && emptyStashSlot.type === "stash") {
        const commands = calculateSwapCommands(
          { type: "inventory", slot },
          emptyStashSlot,
          data // Use real state, not snapshot
        );
        allCommands.push(...commands);
        // Simulate to update state
        for (const cmd of commands) {
          simulateCommand(cmd, data);
        }
      }
      continue;
    }

    // If slot already has the correct item, skip
    if (currentItem && currentItem.itemName === targetItemName) {
      continue;
    }

    // Need to swap - find where target item is in current state
    if (targetItemName) {
      const itemLocation = findItemLocation(targetItemName, data);
      if (!itemLocation) {
        console.warn(
          `Item "${targetItemName}" not found in inventory or stashes`
        );
        continue;
      }

      // Generate swap commands: FROM = target slot (where it should end up), TO = where it currently is
      const commands = calculateSwapCommands(
        { type: "inventory", slot }, // FROM: target build slot
        itemLocation, // TO: current location of the item
        data // Use real state, not snapshot
      );
      allCommands.push(...commands);

      // Simulate each command to update state for next iteration
      for (const cmd of commands) {
        simulateCommand(cmd, data);
      }
    }
  }

  return allCommands;
}

/**
 * Find first empty slot in any stash
 */
function findFirstEmptyStashSlot(data: ParsedLoaderData): ItemLocation | null {
  for (const stash of data.stashes) {
    for (let slot = 1; slot <= 6; slot++) {
      if (!stash.items.find((item) => item.slot === slot)) {
        return {
          type: "stash",
          stashNumber: stash.stashNumber,
          slot,
        };
      }
    }
  }
  return null;
}
