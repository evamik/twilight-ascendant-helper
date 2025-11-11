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

/**
 * Helper to determine the correct order for getting items after stashing both
 * to ensure they land in swapped slots (accounting for gap-filling behavior)
 */
function getSwapOrder(
  fromSlot: number,
  toSlot: number
): { firstGet: number; secondGet: number } {
  // After stashing both items, -g fills slots numerically (lower first, then higher)
  // To swap them, the item from the higher slot must be retrieved first (goes to lower slot)
  // and the item from the lower slot retrieved second (goes to higher slot)
  const lowerSlot = Math.min(fromSlot, toSlot);
  const higherSlot = Math.max(fromSlot, toSlot);

  // Return which slot's item should be retrieved first/second
  return {
    firstGet: higherSlot, // Higher slot item retrieved first -> lands in lower slot
    secondGet: lowerSlot, // Lower slot item retrieved second -> lands in higher slot
  };
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
  const swapOrder = getSwapOrder(from.slot, to.slot);

  // We need to get the higher slot's item first (it goes to lower slot)
  // and lower slot's item second (it goes to higher slot)
  if (swapOrder.firstGet === from.slot) {
    // from slot is higher - need to retrieve it first
    return [
      `-s${temp1.stashNumber} ${from.slot}`, // higher slot item -> temp1
      `-s${temp2.stashNumber} ${to.slot}`, // lower slot item -> temp2
      `-g${temp1.stashNumber} ${temp1.slot}`, // higher slot item retrieved first -> lower slot ✓
      `-g${temp2.stashNumber} ${temp2.slot}`, // lower slot item retrieved second -> higher slot ✓
    ];
  } else {
    // to slot is higher - need to retrieve it first
    return [
      `-s${temp1.stashNumber} ${to.slot}`, // higher slot item -> temp1
      `-s${temp2.stashNumber} ${from.slot}`, // lower slot item -> temp2
      `-g${temp1.stashNumber} ${temp1.slot}`, // higher slot item retrieved first -> lower slot ✓
      `-g${temp2.stashNumber} ${temp2.slot}`, // lower slot item retrieved second -> higher slot ✓
    ];
  }
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
  const stash = data.stashes.find((s) => s.stashNumber === stashNumber);
  const items = stash?.items || [];

  // Check if either slot is empty
  const fromItem = items.find((i) => i.slot === from.slot);
  const toItem = items.find((i) => i.slot === to.slot);

  // If both slots are empty, nothing to do
  if (!fromItem && !toItem) {
    return [];
  }

  // If only one item exists, just move it
  if (!fromItem || !toItem) {
    const hasInventorySpace = findEmptyInventorySlot(data) !== null;

    if (hasInventorySpace) {
      // Simple move with available inventory space
      const itemSlot = fromItem ? from.slot : to.slot;
      return [`-g${stashNumber} ${itemSlot}`, `-s${stashNumber} 1`];
    } else {
      // Inventory full - use temp stash
      // Only exclude current stash if empty slot is LOWER than item slot (gap-filling issue)
      const itemSlot = fromItem ? from.slot : to.slot;
      const emptySlot = fromItem ? to.slot : from.slot;
      const shouldExclude = emptySlot < itemSlot;

      const tempSlots = shouldExclude
        ? findTwoEmptyStashSlots(data, stashNumber)
        : findTwoEmptyStashSlots(data);

      if (!tempSlots) {
        console.error("Need temp stash slot");
        return [];
      }

      const [temp1] = tempSlots;
      const invSlot = 1;
      const invItem = data.inventory.find((i) => i.slot === invSlot);

      const commands: string[] = [];
      if (invItem) {
        commands.push(`-s${temp1.stashNumber} ${invSlot}`);
      }
      commands.push(`-g${stashNumber} ${itemSlot}`);
      commands.push(`-s${stashNumber} ${invSlot}`);
      if (invItem) {
        commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
      }
      return commands;
    }
  }

  // Both slots have items - swap them (can use same stash for temp slots)
  const tempSlots = findTwoEmptyStashSlots(data);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for temp storage");
    return [];
  }

  const [temp1, temp2] = tempSlots;
  const commands: string[] = [];

  // Find or clear two inventory slots
  let invSlot1 = findEmptyInventorySlot(data);
  let invSlot2 = invSlot1 ? findSecondEmptyInventorySlot(data, invSlot1) : null;

  const needToClear = !invSlot1 || !invSlot2;

  if (needToClear) {
    // Clear slots 1 and 2
    invSlot1 = 1;
    invSlot2 = 2;
    const item1 = data.inventory.find((i) => i.slot === 1);
    const item2 = data.inventory.find((i) => i.slot === 2);

    if (item1) commands.push(`-s${temp1.stashNumber} 1`);
    if (item2) commands.push(`-s${temp2.stashNumber} 2`);
  }

  // Determine correct retrieval order to ensure swap
  const swapOrder = getSwapOrder(from.slot, to.slot);

  // Get the higher slot's item first (it will land in invSlot1)
  // and lower slot's item second (it will land in invSlot2)
  if (swapOrder.firstGet === from.slot) {
    // from is higher slot - get it first
    commands.push(`-g${stashNumber} ${from.slot}`); // higher -> invSlot1
    commands.push(`-g${stashNumber} ${to.slot}`); // lower -> invSlot2
  } else {
    // to is higher slot - get it first
    commands.push(`-g${stashNumber} ${to.slot}`); // higher -> invSlot1
    commands.push(`-g${stashNumber} ${from.slot}`); // lower -> invSlot2
  }

  // After getting both, stash slots are now: [lowerSlot, higherSlot] (in order)
  // Stash invSlot1 first (higher slot item) -> goes to lowerSlot ✓
  // Stash invSlot2 second (lower slot item) -> goes to higherSlot ✓
  commands.push(`-s${stashNumber} ${invSlot1}`);
  commands.push(`-s${stashNumber} ${invSlot2}`);

  // Restore cleared inventory items
  if (needToClear) {
    const item1 = data.inventory.find((i) => i.slot === 1);
    const item2 = data.inventory.find((i) => i.slot === 2);

    if (item1) commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
    if (item2) commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
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
  data: ParsedLoaderData,
  excludeStashForTemp?: number // Optional: exclude this stash when finding temp slots
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

  // Exclude target stash AND optionally another stash from temp slots
  const excludeStashes = excludeStashForTemp
    ? [to.stashNumber, excludeStashForTemp]
    : [to.stashNumber];

  const tempSlots = findTwoEmptyStashSlots(data, ...excludeStashes);
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
  // Pass from.stashNumber to exclude it from temp slot search to avoid gap-filling issues
  return swapInventoryWithStash(
    { slot: to.slot },
    { stashNumber: from.stashNumber, slot: from.slot },
    data,
    from.stashNumber // Exclude source stash from temp slots
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

  const fromStash = data.stashes.find(
    (s) => s.stashNumber === from.stashNumber
  );
  const toStash = data.stashes.find((s) => s.stashNumber === to.stashNumber);
  const fromItem = fromStash?.items.find((i) => i.slot === from.slot);
  const toItem = toStash?.items.find((i) => i.slot === to.slot);

  // If both empty, nothing to do
  if (!fromItem && !toItem) {
    return [];
  }

  // If only one item exists, just move it
  if (!fromItem || !toItem) {
    const hasInventorySpace = findEmptyInventorySlot(data) !== null;

    if (hasInventorySpace) {
      // Simple move with available inventory space
      if (fromItem) {
        return [`-g${from.stashNumber} ${from.slot}`, `-s${to.stashNumber} 1`];
      } else {
        return [`-g${to.stashNumber} ${to.slot}`, `-s${from.stashNumber} 1`];
      }
    } else {
      // Inventory full - use temp stash
      const tempSlots = findTwoEmptyStashSlots(
        data,
        from.stashNumber,
        to.stashNumber
      );
      if (!tempSlots) {
        console.error("Need temp stash slot");
        return [];
      }

      const [temp1] = tempSlots;
      const invSlot = 1;
      const invItem = data.inventory.find((i) => i.slot === invSlot);

      const commands: string[] = [];
      if (invItem) {
        commands.push(`-s${temp1.stashNumber} ${invSlot}`);
      }

      if (fromItem) {
        commands.push(`-g${from.stashNumber} ${from.slot}`);
        commands.push(`-s${to.stashNumber} ${invSlot}`);
      } else {
        commands.push(`-g${to.stashNumber} ${to.slot}`);
        commands.push(`-s${from.stashNumber} ${invSlot}`);
      }

      if (invItem) {
        commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
      }
      return commands;
    }
  }

  // Both items exist - swap them
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

  // Find or clear two inventory slots
  let invSlot1 = findEmptyInventorySlot(data);
  let invSlot2 = invSlot1 ? findSecondEmptyInventorySlot(data, invSlot1) : null;

  const needToClear = !invSlot1 || !invSlot2;

  if (needToClear) {
    // Clear slots 1 and 2
    invSlot1 = 1;
    invSlot2 = 2;
    const item1 = data.inventory.find((i) => i.slot === 1);
    const item2 = data.inventory.find((i) => i.slot === 2);

    if (item1) commands.push(`-s${temp1.stashNumber} 1`);
    if (item2) commands.push(`-s${temp2.stashNumber} 2`);
  }

  // Get both items - they land in invSlot1 and invSlot2 (numerically ordered)
  commands.push(`-g${from.stashNumber} ${from.slot}`);
  commands.push(`-g${to.stashNumber} ${to.slot}`);

  // Stash to swapped stashes - item in invSlot1 goes to toStash, item in invSlot2 goes to fromStash
  commands.push(`-s${to.stashNumber} ${invSlot1}`);
  commands.push(`-s${from.stashNumber} ${invSlot2}`);

  // Restore cleared inventory items
  if (needToClear) {
    const item1 = data.inventory.find((i) => i.slot === 1);
    const item2 = data.inventory.find((i) => i.slot === 2);

    if (item1) commands.push(`-g${temp1.stashNumber} ${temp1.slot}`);
    if (item2) commands.push(`-g${temp2.stashNumber} ${temp2.slot}`);
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
