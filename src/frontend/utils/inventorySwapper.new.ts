import type { ParsedLoaderData } from "./loaderParser";

export type ItemLocation =
  | { type: "inventory"; slot: number }
  | { type: "stash"; stashNumber: number; slot: number };

// ============================================================================
// HELPER FUNCTIONS - Find Empty Slots
// ============================================================================

/**
 * Find first empty slot in inventory (1-6)
 */
export function findEmptyInventorySlot(data: ParsedLoaderData): number | null {
  for (let slot = 1; slot <= 6; slot++) {
    if (!data.inventory.find((item) => item.slot === slot)) {
      return slot;
    }
  }
  return null;
}

/**
 * Find second empty slot in inventory (excluding the first one)
 */
export function findSecondEmptyInventorySlot(
  data: ParsedLoaderData,
  firstSlot: number
): number | null {
  for (let slot = 1; slot <= 6; slot++) {
    if (
      slot !== firstSlot &&
      !data.inventory.find((item) => item.slot === slot)
    ) {
      return slot;
    }
  }
  return null;
}

/**
 * Find first empty slot in any stash, optionally excluding certain stashes
 */
export function findEmptyStashSlot(
  data: ParsedLoaderData,
  ...excludeStashNumbers: number[]
): { stashNumber: number; slot: number } | null {
  for (let stashNum = 1; stashNum <= 6; stashNum++) {
    if (excludeStashNumbers.includes(stashNum)) continue;

    const stash = data.stashes.find((s) => s.stashNumber === stashNum);
    const items = stash?.items || [];

    for (let slot = 1; slot <= 6; slot++) {
      if (!items.find((item) => item.slot === slot)) {
        return { stashNumber: stashNum, slot };
      }
    }
  }
  return null;
}

/**
 * Find empty slot in a specific stash
 */
export function findEmptySlotInStash(
  data: ParsedLoaderData,
  stashNumber: number
): number | null {
  const stash = data.stashes.find((s) => s.stashNumber === stashNumber);
  const items = stash?.items || [];

  for (let slot = 1; slot <= 6; slot++) {
    if (!items.find((item) => item.slot === slot)) {
      return slot;
    }
  }
  return null;
}

/**
 * Find 2 empty stash slots - prefers same stash, but can use different stashes
 * Excludes the specified stash number(s)
 */
function findTwoEmptyStashSlots(
  data: ParsedLoaderData,
  ...excludeStashes: number[]
):
  | [
      { stashNumber: number; slot: number },
      { stashNumber: number; slot: number }
    ]
  | null {
  const first = findEmptyStashSlot(data, ...excludeStashes);
  if (!first) return null;

  // Try to find second slot in same stash
  const secondInSame = findEmptySlotInStash(data, first.stashNumber);
  if (secondInSame && secondInSame !== first.slot) {
    return [first, { stashNumber: first.stashNumber, slot: secondInSame }];
  }

  // Find second slot in different stash
  const second = findEmptyStashSlot(data, ...excludeStashes);
  if (
    !second ||
    (second.stashNumber === first.stashNumber && second.slot === first.slot)
  ) {
    return null;
  }

  return [first, second];
}

// ============================================================================
// CORE SWAP FUNCTIONS - Following User's Instructions
// ============================================================================

/**
 * Swap two items in inventory
 *
 * Pattern:
 * -sx1 i1    // Stash first inv item to temp location
 * -sx2 i2    // Stash second inv item to temp location
 * -gx2 y2    // Get second item back
 * -gx1 y1    // Get first item back
 */
function swapInventoryWithInventory(
  slot1: number,
  slot2: number,
  data: ParsedLoaderData
): string[] {
  const tempSlots = findTwoEmptyStashSlots(data);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots to swap inventory items");
    return [];
  }

  const [temp1, temp2] = tempSlots;

  return [
    `-s${temp1.stashNumber} ${slot1}`, // Stash i1 to temp
    `-s${temp2.stashNumber} ${slot2}`, // Stash i2 to temp
    `-g${temp2.stashNumber} ${temp2.slot}`, // Get i2 back (goes to slot1)
    `-g${temp1.stashNumber} ${temp1.slot}`, // Get i1 back (goes to slot2)
  ];
}

/**
 * Swap two items in the same stash
 *
 * Pattern (using inv slots 1 and 2 as temp):
 * -sx1 1     // Clear inv slot 1
 * -sx2 2     // Clear inv slot 2
 * -gd z1     // Get first stash item
 * -gd z2     // Get second stash item
 * -sd 2      // Stash back (goes to first empty in stash)
 * -sd 1      // Stash back (goes to second empty in stash)
 * -gx1 y1    // Restore original inv item
 * -gx2 y2    // Restore original inv item
 */
function swapInSameStash(
  stashNumber: number,
  slot1: number,
  slot2: number,
  data: ParsedLoaderData
): string[] {
  // Find temp stash slots to hold inventory items
  const tempSlots = findTwoEmptyStashSlots(data, stashNumber);
  if (!tempSlots) {
    console.error(
      "Need 2 empty stash slots (in different stash) for temp storage"
    );
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const commands: string[] = [];

  // Check which inventory slots we'll use (prefer 1 and 2, but adapt if occupied)
  const invSlot1 = data.inventory.find((i) => i.slot === 1)
    ? 1
    : findEmptyInventorySlot(data);
  const invSlot2 = data.inventory.find((i) => i.slot === 2)
    ? 2
    : findSecondEmptyInventorySlot(data, invSlot1 || 1);

  if (!invSlot1 || !invSlot2) {
    console.error("Need at least 2 inventory slots for same-stash swap");
    return [];
  }

  // Clear inventory slots if needed
  const itemInSlot1 = data.inventory.find((i) => i.slot === invSlot1);
  const itemInSlot2 = data.inventory.find((i) => i.slot === invSlot2);

  if (itemInSlot1) {
    commands.push(`-s${temp1.stashNumber} ${invSlot1}`);
  }
  if (itemInSlot2) {
    commands.push(`-s${temp2.stashNumber} ${invSlot2}`);
  }

  // Get both stash items to inventory
  commands.push(`-g${stashNumber} ${slot1}`); // Goes to first empty inv (invSlot1)
  commands.push(`-g${stashNumber} ${slot2}`); // Goes to second empty inv (invSlot2)

  // Stash them back in reverse order (they fill first available slots in stash)
  commands.push(`-s${stashNumber} ${invSlot2}`); // Item from slot2 goes back
  commands.push(`-s${stashNumber} ${invSlot1}`); // Item from slot1 goes back

  // Restore original inventory items
  if (itemInSlot1) {
    commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
  }
  if (itemInSlot2) {
    commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
  }

  return commands;
}

/**
 * Swap item from inventory with item from stash
 *
 * Pattern:
 * -sx1 i1    // Stash inv item to temp
 * -gd z1     // Get stash item
 * -sx2 1     // Stash it to another temp
 * -gx1 y1    // Get inv item back from temp
 * -sd 1      // Put it in stash
 * -gx2 y2    // Get stash item back
 */
function swapInventoryWithStash(
  invSlot: number,
  stashNumber: number,
  stashSlot: number,
  data: ParsedLoaderData
): string[] {
  // Special case: if slots match, use -w command
  if (invSlot === stashSlot) {
    return [`-w${stashNumber} ${invSlot}`];
  }

  const tempSlots = findTwoEmptyStashSlots(data, stashNumber);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;

  return [
    `-s${temp1.stashNumber} ${invSlot}`, // Stash inv item
    `-g${stashNumber} ${stashSlot}`, // Get stash item
    `-s${temp2.stashNumber} ${invSlot}`, // Stash it to temp (it's now in invSlot)
    `-g${temp1.stashNumber} ${temp1.slot}`, // Get inv item back
    `-s${stashNumber} ${invSlot}`, // Put it in stash
    `-g${temp2.stashNumber} ${temp2.slot}`, // Get stash item back to inv
  ];
}

/**
 * Swap items between two different stashes
 *
 * Pattern (using inv slot 1 for routing):
 * -sx1 1     // Clear inv slot 1
 * -sx2 2     // Clear inv slot 2 (if needed)
 * -gd1 z1    // Get item from stash 1
 * -gd2 z2    // Get item from stash 2
 * -sd1 2     // Put stash2's item into stash1
 * -sd2 1     // Put stash1's item into stash2
 * -gx1 y1    // Restore inv item
 * -gx2 y2    // Restore inv item
 */
function swapBetweenStashes(
  stash1Number: number,
  stash1Slot: number,
  stash2Number: number,
  stash2Slot: number,
  data: ParsedLoaderData
): string[] {
  const tempSlots = findTwoEmptyStashSlots(data, stash1Number, stash2Number);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const commands: string[] = [];

  // Use inventory slots 1 and 2 as routing slots
  const invSlot1 = 1;
  const invSlot2 = 2;

  const itemInSlot1 = data.inventory.find((i) => i.slot === invSlot1);
  const itemInSlot2 = data.inventory.find((i) => i.slot === invSlot2);

  // Clear inventory slots if needed
  if (itemInSlot1) {
    commands.push(`-s${temp1.stashNumber} ${invSlot1}`);
  }
  if (itemInSlot2) {
    commands.push(`-s${temp2.stashNumber} ${invSlot2}`);
  }

  // Get both stash items
  commands.push(`-g${stash1Number} ${stash1Slot}`); // Goes to invSlot1
  commands.push(`-g${stash2Number} ${stash2Slot}`); // Goes to invSlot2

  // Put them in swapped stashes
  commands.push(`-s${stash1Number} ${invSlot2}`); // Stash2's item goes to stash1
  commands.push(`-s${stash2Number} ${invSlot1}`); // Stash1's item goes to stash2

  // Restore inventory items
  if (itemInSlot1) {
    commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
  }
  if (itemInSlot2) {
    commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
  }

  return commands;
}

// ============================================================================
// SPECIAL CASES - Move to Empty Slot (not a swap)
// ============================================================================

function moveInventoryToEmptyStash(
  invSlot: number,
  stashNumber: number
): string[] {
  // Find first empty slot in target stash
  return [`-s${stashNumber} ${invSlot}`];
}

function moveStashToEmptyInventory(
  stashNumber: number,
  stashSlot: number
): string[] {
  return [`-g${stashNumber} ${stashSlot}`];
}

// ============================================================================
// MAIN ROUTING FUNCTION
// ============================================================================

/**
 * Calculate swap commands for any two item locations
 */
export function calculateSwapCommands(
  from: ItemLocation,
  to: ItemLocation,
  data: ParsedLoaderData
): string[] {
  // Inventory -> Inventory
  if (from.type === "inventory" && to.type === "inventory") {
    if (from.slot === to.slot) return [];
    return swapInventoryWithInventory(from.slot, to.slot, data);
  }

  // Inventory -> Stash
  if (from.type === "inventory" && to.type === "stash") {
    // Check if target stash slot is empty
    const targetStash = data.stashes.find(
      (s) => s.stashNumber === to.stashNumber
    );
    const targetItem = targetStash?.items.find((i) => i.slot === to.slot);

    if (!targetItem) {
      // Target is empty, just move
      return moveInventoryToEmptyStash(from.slot, to.stashNumber);
    }

    return swapInventoryWithStash(from.slot, to.stashNumber, to.slot, data);
  }

  // Stash -> Inventory
  if (from.type === "stash" && to.type === "inventory") {
    // Check if target inv slot is empty
    const targetItem = data.inventory.find((i) => i.slot === to.slot);

    if (!targetItem) {
      // Target is empty, just move
      return moveStashToEmptyInventory(from.stashNumber, from.slot);
    }

    return swapInventoryWithStash(to.slot, from.stashNumber, from.slot, data);
  }

  // Stash -> Stash
  if (from.type === "stash" && to.type === "stash") {
    // Same stash
    if (from.stashNumber === to.stashNumber) {
      if (from.slot === to.slot) return [];
      return swapInSameStash(from.stashNumber, from.slot, to.slot, data);
    }

    // Different stashes
    // Check if target is empty
    const targetStash = data.stashes.find(
      (s) => s.stashNumber === to.stashNumber
    );
    const targetItem = targetStash?.items.find((i) => i.slot === to.slot);

    if (!targetItem) {
      // Just move via inventory
      return [
        `-g${from.stashNumber} ${from.slot}`,
        `-s${to.stashNumber} ${findEmptyInventorySlot(data)}`,
      ];
    }

    return swapBetweenStashes(
      from.stashNumber,
      from.slot,
      to.stashNumber,
      to.slot,
      data
    );
  }

  return [];
}

// ============================================================================
// LEGACY EXPORTS - For backward compatibility with existing code
// ============================================================================

export {
  swapInventoryWithInventory,
  swapInSameStash,
  swapInventoryWithStash,
  swapBetweenStashes,
};

// Additional legacy function names for compatibility
export function swapStashWithInventory(
  from: { stashNumber: number; slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  const targetItem = data.inventory.find((i) => i.slot === to.slot);
  if (!targetItem) {
    return moveStashToEmptyInventory(from.stashNumber, from.slot);
  }
  return swapInventoryWithStash(to.slot, from.stashNumber, from.slot, data);
}
