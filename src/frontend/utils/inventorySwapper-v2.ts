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
  stashNumber: number,
  ...excludeSlots: number[]
): number | null {
  const stash = data.stashes.find((s) => s.stashNumber === stashNumber);
  const items = stash?.items || [];

  for (let slot = 1; slot <= 6; slot++) {
    if (
      !excludeSlots.includes(slot) &&
      !items.find((item) => item.slot === slot)
    ) {
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
  const secondInSame = findEmptySlotInStash(
    data,
    first.stashNumber,
    first.slot
  );
  if (secondInSame !== null) {
    return [first, { stashNumber: first.stashNumber, slot: secondInSame }];
  }

  // Find second slot in different stash
  const second = findEmptyStashSlot(data, ...excludeStashes, first.stashNumber);
  if (!second) return null;

  return [first, second];
}

// ============================================================================
// CORE SWAP IMPLEMENTATIONS
// ============================================================================

/**
 * Swap two items in inventory
 * Uses pattern: -sx1 i1, -sx2 i2, -gx2 y2, -gx1 y1
 */
export function swapInventoryWithInventory(
  from: { slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  if (from.slot === to.slot) return [];

  const tempSlots = findTwoEmptyStashSlots(data);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots to swap inventory items");
    return [];
  }

  const [temp1, temp2] = tempSlots;

  return [
    `-s${temp1.stashNumber} ${from.slot}`,
    `-s${temp2.stashNumber} ${to.slot}`,
    `-g${temp2.stashNumber} ${temp2.slot}`,
    `-g${temp1.stashNumber} ${temp1.slot}`,
  ];
}

/**
 * Swap two items in the same stash
 * Uses pattern: -sx1 1, -sx2 2, -gd z1, -gd z2, -sd 2, -sd 1, -gx1 y1, -gx2 y2
 */
export function swapInSameStash(
  from: { stashNumber: number; slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  if (from.slot === to.slot) return [];

  const stashNumber = from.stashNumber;
  const tempSlots = findTwoEmptyStashSlots(data, stashNumber);

  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const commands: string[] = [];

  // Use inventory slots 1 and 2 (or find empty ones if occupied)
  let invSlot1 = 1;
  let invSlot2 = 2;

  const item1 = data.inventory.find((i) => i.slot === invSlot1);
  const item2 = data.inventory.find((i) => i.slot === invSlot2);

  // If slots 1 or 2 are occupied, find empty slots
  if (item1 || item2) {
    const empty1 = findEmptyInventorySlot(data);
    const empty2 = empty1 ? findSecondEmptyInventorySlot(data, empty1) : null;

    if (!empty1 || !empty2) {
      // Inventory is too full, need to clear slots 1 and 2
      if (item1) {
        commands.push(`-s${temp1.stashNumber} ${invSlot1}`);
      }
      if (item2) {
        commands.push(`-s${temp2.stashNumber} ${invSlot2}`);
      }
    } else {
      invSlot1 = empty1;
      invSlot2 = empty2;
    }
  }

  // Get both stash items
  commands.push(`-g${stashNumber} ${from.slot}`);
  commands.push(`-g${stashNumber} ${to.slot}`);

  // Stash them back in reverse order
  commands.push(`-s${stashNumber} ${invSlot2}`);
  commands.push(`-s${stashNumber} ${invSlot1}`);

  // Restore inventory items if we cleared them
  if (item1 && invSlot1 === 1) {
    commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
  }
  if (item2 && invSlot2 === 2) {
    commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
  }

  return commands;
}

/**
 * Swap item from inventory with item from stash
 * Uses pattern: -sx1 i1, -gd z1, -sx2 1, -gx1 y1, -sd 1, -gx2 y2
 */
export function swapInventoryWithStash(
  from: { slot: number },
  to: { stashNumber: number; slot: number },
  data: ParsedLoaderData
): string[] {
  // Special case: if slots match, use -w command
  if (from.slot === to.slot) {
    return [`-w${to.stashNumber} ${from.slot}`];
  }

  // Check if target stash slot is empty
  const targetStash = data.stashes.find(
    (s) => s.stashNumber === to.stashNumber
  );
  const targetItem = targetStash?.items.find((i) => i.slot === to.slot);

  if (!targetItem) {
    // Target is empty, just move
    return [`-s${to.stashNumber} ${from.slot}`];
  }

  const tempSlots = findTwoEmptyStashSlots(data, to.stashNumber);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const invSlot = from.slot;

  return [
    `-s${temp1.stashNumber} ${invSlot}`,
    `-g${to.stashNumber} ${to.slot}`,
    `-s${temp2.stashNumber} ${invSlot}`,
    `-g${temp1.stashNumber} ${temp1.slot}`,
    `-s${to.stashNumber} ${invSlot}`,
    `-g${temp2.stashNumber} ${temp2.slot}`,
  ];
}

/**
 * Swap item from stash with item from inventory
 */
export function swapStashWithInventory(
  from: { stashNumber: number; slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  // Special case: if slots match, use -w command
  if (from.slot === to.slot) {
    return [`-w${from.stashNumber} ${to.slot}`];
  }

  // Check if target inv slot is empty
  const targetItem = data.inventory.find((i) => i.slot === to.slot);

  if (!targetItem) {
    // Target is empty, just move
    return [`-g${from.stashNumber} ${from.slot}`];
  }

  // Swap inv -> stash (same logic, just flipped)
  return swapInventoryWithStash(
    { slot: to.slot },
    { stashNumber: from.stashNumber, slot: from.slot },
    data
  );
}

/**
 * Swap items between two different stashes
 * Uses pattern: -sx1 1, -sx2 2, -gd1 z1, -gd2 z2, -sd1 2, -sd2 1, -gx1 y1, -gx2 y2
 */
export function swapBetweenStashes(
  from: { stashNumber: number; slot: number },
  to: { stashNumber: number; slot: number },
  data: ParsedLoaderData
): string[] {
  // Same stash
  if (from.stashNumber === to.stashNumber) {
    return swapInSameStash(from, { slot: to.slot }, data);
  }

  // Check if target is empty
  const targetStash = data.stashes.find(
    (s) => s.stashNumber === to.stashNumber
  );
  const targetItem = targetStash?.items.find((i) => i.slot === to.slot);

  if (!targetItem) {
    // Just move via inventory
    return [`-g${from.stashNumber} ${from.slot}`, `-s${to.stashNumber} 1`];
  }

  const tempSlots = findTwoEmptyStashSlots(
    data,
    from.stashNumber,
    to.stashNumber
  );
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const commands: string[] = [];

  // Use inventory slots 1 and 2
  const invSlot1 = 1;
  const invSlot2 = 2;

  const item1 = data.inventory.find((i) => i.slot === invSlot1);
  const item2 = data.inventory.find((i) => i.slot === invSlot2);

  // Clear inventory slots if needed
  if (item1) {
    commands.push(`-s${temp1.stashNumber} ${invSlot1}`);
  }
  if (item2) {
    commands.push(`-s${temp2.stashNumber} ${invSlot2}`);
  }

  // Get both stash items
  commands.push(`-g${from.stashNumber} ${from.slot}`);
  commands.push(`-g${to.stashNumber} ${to.slot}`);

  // Put them in swapped stashes
  commands.push(`-s${from.stashNumber} ${invSlot2}`);
  commands.push(`-s${to.stashNumber} ${invSlot1}`);

  // Restore inventory items
  if (item1) {
    commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
  }
  if (item2) {
    commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
  }

  return commands;
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
    return swapInventoryWithInventory(
      { slot: from.slot },
      { slot: to.slot },
      data
    );
  }

  // Inventory -> Stash
  if (from.type === "inventory" && to.type === "stash") {
    return swapInventoryWithStash(
      { slot: from.slot },
      { stashNumber: to.stashNumber, slot: to.slot },
      data
    );
  }

  // Stash -> Inventory
  if (from.type === "stash" && to.type === "inventory") {
    return swapStashWithInventory(
      { stashNumber: from.stashNumber, slot: from.slot },
      { slot: to.slot },
      data
    );
  }

  // Stash -> Stash
  if (from.type === "stash" && to.type === "stash") {
    return swapBetweenStashes(
      { stashNumber: from.stashNumber, slot: from.slot },
      { stashNumber: to.stashNumber, slot: to.slot },
      data
    );
  }

  return [];
}
