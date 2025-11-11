import type { ParsedLoaderData } from "./loaderParser";

export type ItemLocation =
  | { type: "inventory"; slot: number }
  | { type: "stash"; stashNumber: number; slot: number };

/**
 * Find first empty slot in inventory
 */
export function findEmptyInventorySlot(data: ParsedLoaderData): number | null {
  for (let i = 1; i <= 6; i++) {
    if (!data.inventory.find((item) => item.slot === i)) {
      return i;
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
  for (let i = 1; i <= 6; i++) {
    if (i !== firstSlot && !data.inventory.find((item) => item.slot === i)) {
      return i;
    }
  }
  return null;
}

/**
 * Find first empty slot in any stash
 */
export function findEmptyStashSlot(
  data: ParsedLoaderData,
  ...excludeStashNumbers: number[]
): { stashNumber: number; slot: number } | null {
  for (let stashNum = 1; stashNum <= 6; stashNum++) {
    if (excludeStashNumbers.includes(stashNum)) continue;

    const stash = data.stashes.find((s) => s.stashNumber === stashNum);
    const existingItems = stash ? stash.items : [];
    for (let slot = 1; slot <= 6; slot++) {
      if (!existingItems.find((item) => item.slot === slot)) {
        return { stashNumber: stashNum, slot };
      }
    }
  }
  return null;
}

/**
 * Find empty slot in a specific stash (excluding specific slots)
 */
export function findEmptySlotInStash(
  data: ParsedLoaderData,
  stashNumber: number,
  ...excludeSlots: number[]
): number | null {
  const stash = data.stashes.find((s) => s.stashNumber === stashNumber);
  const existingItems = stash ? stash.items : [];

  for (let slot = 1; slot <= 6; slot++) {
    if (
      !excludeSlots.includes(slot) &&
      !existingItems.find((item) => item.slot === slot)
    ) {
      return slot;
    }
  }
  return null;
}

/**
 * Find 2 empty stash slots - tries same stash first, then different stashes
 * Returns null if can't find 2 slots
 */
export function findTwoTempStashSlots(
  data: ParsedLoaderData,
  ...excludeStashNumbers: number[]
):
  | [
      { stashNumber: number; slot: number },
      { stashNumber: number; slot: number }
    ]
  | null {
  const tempSlot1 = findEmptyStashSlot(data, ...excludeStashNumbers);
  if (!tempSlot1) return null;

  // Try to find second slot in same stash first
  const slot2InSameStash = findEmptySlotInStash(
    data,
    tempSlot1.stashNumber,
    tempSlot1.slot
  );

  if (slot2InSameStash) {
    return [
      tempSlot1,
      { stashNumber: tempSlot1.stashNumber, slot: slot2InSameStash },
    ];
  }

  // Find in different stash
  const tempSlot2 = findEmptyStashSlot(
    data,
    ...excludeStashNumbers,
    tempSlot1.stashNumber
  );

  if (tempSlot2) {
    return [tempSlot1, tempSlot2];
  }

  return null;
}

/**
 * Swap two items within inventory
 * Strategy: Use temporary stash slots and track where items land
 */
export function swapInventoryWithInventory(
  from: { slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  const commands: string[] = [];

  // Can't swap to same slot
  if (from.slot === to.slot) return commands;

  // Find 2 empty stash slots for temporary storage
  const tempSlots = findTwoTempStashSlots(data);
  if (!tempSlots) {
    console.error("Need 2 empty stash slots for inventory swap");
    return commands;
  }

  const [tempSlot1, tempSlot2] = tempSlots;

  // Move items to specific slots
  commands.push(`-s${tempSlot1.stashNumber} ${from.slot}`); // from item → tempSlot1
  commands.push(`-s${tempSlot2.stashNumber} ${to.slot}`); // to item → tempSlot2

  // Get them back in swapped order
  commands.push(`-g${tempSlot2.stashNumber} ${tempSlot2.slot}`); // Get 'to' item
  commands.push(`-g${tempSlot1.stashNumber} ${tempSlot1.slot}`); // Get 'from' item

  return commands;
}

/**
 * Swap inventory item with stash item
 */
export function swapInventoryWithStash(
  from: { slot: number },
  to: { stashNumber: number; slot: number },
  data: ParsedLoaderData
): string[] {
  const commands: string[] = [];

  const targetStash = data.stashes.find(
    (s) => s.stashNumber === to.stashNumber
  );
  const targetItem = targetStash?.items.find((item) => item.slot === to.slot);

  if (!targetItem) {
    // Target stash slot is empty - just stash the item
    commands.push(`-s${to.stashNumber} ${from.slot}`);
    return commands;
  }

  // Both slots have items - need to swap
  // Check if we can use -w command (same slot numbers)
  if (from.slot === to.slot) {
    commands.push(`-w${to.stashNumber} ${from.slot}`);
    return commands;
  }

  // Different slot numbers - need complex swap
  // We need at least 1 empty slot somewhere (either inventory or stash)
  const emptyInvSlot = findEmptyInventorySlot(data);

  if (emptyInvSlot) {
    // Strategy 1: Have empty inventory slot (4 commands)
    const tempStashSlot = findEmptyStashSlot(data);
    if (!tempStashSlot) {
      console.error(
        "[swapInventoryWithStash] Need empty stash slot for temp storage"
      );
      return [];
    }

    // 1. Get stash item to inventory
    commands.push(`-g${to.stashNumber} ${to.slot}`); // Goes to emptyInvSlot

    // 2. Move it to temp stash
    commands.push(`-s${tempStashSlot.stashNumber} ${emptyInvSlot}`);

    // 3. Move our inventory item to target stash
    commands.push(`-s${to.stashNumber} ${from.slot}`);

    // 4. Get temp item back to inventory
    commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`);

    return commands;
  }

  // Strategy 2: No empty inventory, need 2 empty stash slots (5 commands)
  const tempSlots = findTwoTempStashSlots(data);
  if (!tempSlots) {
    console.error(
      "[swapInventoryWithStash] Need either: 1 empty inv slot + 1 empty stash, OR 2 empty stash slots"
    );
    return commands;
  }

  const [tempSlot1, tempSlot2] = tempSlots;
  console.log(
    `[swapInventoryWithStash] Strategy 2: Full inventory, using 2 temp stash slots (stash${tempSlot1.stashNumber} slot${tempSlot1.slot}, stash${tempSlot2.stashNumber} slot${tempSlot2.slot})`
  );

  // 1. Stash our inventory item to temp location (makes room)
  commands.push(`-s${tempSlot1.stashNumber} ${from.slot}`);

  // 2. Get target stash item to inventory (now there's room)
  commands.push(`-g${to.stashNumber} ${to.slot}`); // Goes to from.slot

  // 3. Stash it to second temp location
  commands.push(`-s${tempSlot2.stashNumber} ${from.slot}`);

  // 4. Get our original item back
  commands.push(`-g${tempSlot1.stashNumber} ${tempSlot1.slot}`); // Goes to from.slot

  // 5. Stash it to target location
  commands.push(`-s${to.stashNumber} ${from.slot}`); // Goes to to.slot

  return commands;
}

/**
 * Swap stash item with inventory item
 */
export function swapStashWithInventory(
  from: { stashNumber: number; slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  const commands: string[] = [];

  const targetItem = data.inventory.find((item) => item.slot === to.slot);

  if (!targetItem) {
    // Target inventory slot is empty - just get the item
    commands.push(`-g${from.stashNumber} ${from.slot}`);
    return commands;
  }

  // Both slots have items - need to swap
  // Check if we can use -w command (same slot numbers)
  if (from.slot === to.slot) {
    commands.push(`-w${from.stashNumber} ${to.slot}`);
    return commands;
  }

  // Different slot numbers - need complex swap
  const emptyInvSlot = findEmptyInventorySlot(data);
  const emptyStashSlot = findEmptyStashSlot(data);

  if (emptyInvSlot && emptyStashSlot) {
    // 1. Move inventory item to temp stash
    commands.push(`-s${emptyStashSlot.stashNumber} ${to.slot}`);

    // 2. Get our stash item to inventory
    commands.push(`-g${from.stashNumber} ${from.slot}`);

    // 3. Get temp item back
    commands.push(`-g${emptyStashSlot.stashNumber} ${emptyStashSlot.slot}`);
  } else {
    console.error("Not enough empty slots for stash-inventory swap");
  }

  return commands;
}

/**
 * Swap two items within the same stash
 * Strategy: Use inventory slots OR temp stash slots as intermediate storage
 */
export function swapInSameStash(
  from: { stashNumber: number; slot: number },
  to: { slot: number },
  data: ParsedLoaderData
): string[] {
  const commands: string[] = [];

  // Can't swap to same slot
  if (from.slot === to.slot) return commands;

  const emptyInvSlot1 = findEmptyInventorySlot(data);
  const emptyInvSlot2 = emptyInvSlot1
    ? findSecondEmptyInventorySlot(data, emptyInvSlot1)
    : null;

  console.log(
    `[swapInSameStash] Swapping stash${from.stashNumber} slot${from.slot} <-> slot${to.slot}`
  );
  console.log(
    `[swapInSameStash] Empty inv slots: ${emptyInvSlot1}, ${emptyInvSlot2}`
  );

  // Strategy 1: If we have 2 empty inventory slots, use them (simplest)
  if (emptyInvSlot1 && emptyInvSlot2) {
    console.log(
      `Swapping stash${from.stashNumber} slot${from.slot} with slot${to.slot} using 2 inv slots`
    );

    // Get both items to inventory
    commands.push(`-g${from.stashNumber} ${from.slot}`); // Goes to emptyInvSlot1
    commands.push(`-g${from.stashNumber} ${to.slot}`); // Goes to emptyInvSlot2

    // Now both original stash slots are empty
    // Stash them back in swapped order (lower slot fills first)
    const lowerStashSlot = Math.min(from.slot, to.slot);

    if (from.slot === lowerStashSlot) {
      commands.push(`-s${from.stashNumber} ${emptyInvSlot2}`); // to item -> lower slot
      commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // from item -> higher slot
    } else {
      commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // from item -> lower slot
      commands.push(`-s${from.stashNumber} ${emptyInvSlot2}`); // to item -> higher slot
    }

    console.log("Commands (2 inv slots):", commands);
    return commands;
  }

  // Strategy 2: If we have 1 empty inventory slot, use temp stash slot
  if (emptyInvSlot1) {
    console.log(`[swapInSameStash] Trying Strategy 2: 1 inv slot + temp stash`);
    // Find an empty stash slot in a DIFFERENT stash (can't use the same stash we're swapping in)
    let tempStashSlot: { stashNumber: number; slot: number } | null = null;

    for (let stashNum = 1; stashNum <= 6; stashNum++) {
      if (stashNum === from.stashNumber) continue; // Skip the stash we're swapping in

      const emptySlot = findEmptySlotInStash(data, stashNum);
      if (emptySlot) {
        tempStashSlot = { stashNumber: stashNum, slot: emptySlot };
        break;
      }
    }

    console.log(`[swapInSameStash] Found temp stash slot:`, tempStashSlot);

    if (tempStashSlot) {
      console.log(
        `Swapping stash${from.stashNumber} slot${from.slot} with slot${to.slot} using 1 inv + 1 temp stash`
      );

      // Step 1: Move first item (from.slot) to temp stash via inventory
      commands.push(`-g${from.stashNumber} ${from.slot}`); // Get to inventory
      commands.push(`-s${tempStashSlot.stashNumber} ${emptyInvSlot1}`); // Stash to temp location

      // Step 2: Move second item (to.slot) to temp stash via inventory
      const tempStashSlot2 = findEmptySlotInStash(
        data,
        tempStashSlot.stashNumber,
        tempStashSlot.slot
      );
      console.log(
        `[swapInSameStash] Found second temp stash slot: ${tempStashSlot2}`
      );
      if (!tempStashSlot2) {
        console.error("Need 2 temp stash slots in the same temp stash");
        return []; // Return empty array instead of incomplete commands
      }

      commands.push(`-g${from.stashNumber} ${to.slot}`); // Get to inventory
      commands.push(`-s${tempStashSlot.stashNumber} ${emptyInvSlot1}`); // Stash to temp location

      // Step 3: Now both original slots are empty in the target stash
      // Move items back in swapped order (lower slot fills first)
      const lowerStashSlot = Math.min(from.slot, to.slot);

      if (to.slot === lowerStashSlot) {
        // to item should go to lower slot, so move it first
        commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot2}`); // Get 'to' item
        commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // Stash to original stash (goes to lower slot)
        commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`); // Get 'from' item
        commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // Stash to original stash (goes to higher slot)
      } else {
        // from item should go to lower slot, so move it first
        commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`); // Get 'from' item
        commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // Stash to original stash (goes to lower slot)
        commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot2}`); // Get 'to' item
        commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`); // Stash to original stash (goes to higher slot)
      }

      console.log("Commands (1 inv + temp stash):", commands);
      return commands;
    }
  }

  // Strategy 3: Inventory is completely full - use temp stash slots only
  // We need to make space in inventory first, then proceed
  console.log(
    `[swapInSameStash] Trying Strategy 3: 0 inv slots, full inventory`
  );
  let tempStashSlot: { stashNumber: number; slot: number } | null = null;

  for (let stashNum = 1; stashNum <= 6; stashNum++) {
    if (stashNum === from.stashNumber) continue; // Skip the stash we're swapping in

    const emptySlot = findEmptySlotInStash(data, stashNum);
    if (emptySlot) {
      tempStashSlot = { stashNumber: stashNum, slot: emptySlot };
      break;
    }
  }

  console.log(
    `[swapInSameStash] Strategy 3 - Found temp stash:`,
    tempStashSlot
  );

  if (tempStashSlot) {
    // This optimized strategy only needs 1 temp stash slot
    console.log(
      `Swapping stash${from.stashNumber} slot${from.slot} with slot${to.slot} with full inventory (0 inv slots, optimized)`
    );

    // Optimized 5-step strategy using -w command
    // Example: swap stash1 slot2 with stash1 slot4
    // Step 1: -s2 1 (stash inv item to temp, creates free inv slot)
    // Step 2: -g1 4 (get higher slot item to inventory)
    // Step 3: -w1 1 (swap inv item with lower stash slot)
    // Step 4: -s1 1 (stash inv item to higher stash slot)
    // Step 5: -g2 1 (retrieve temp item back to inventory)

    // Pick an inventory item to create temp space
    const invItem = data.inventory[0];
    if (!invItem) {
      console.error("Inventory should be full but no items found");
      return commands;
    }

    // Step 1: Make temp slot in inventory by stashing one item
    commands.push(`-s${tempStashSlot.stashNumber} ${invItem.slot}`);

    // Step 2: Get the item from the higher slot number (will go to the freed inventory slot)
    const higherStashSlot = Math.max(from.slot, to.slot);

    commands.push(`-g${from.stashNumber} ${higherStashSlot}`);

    // Step 3: Swap using -w (inv slot with lower stash slot)
    commands.push(`-w${from.stashNumber} ${invItem.slot}`);

    // Step 4: Place the item from inventory to the higher stash slot
    commands.push(`-s${from.stashNumber} ${invItem.slot}`);

    // Step 5: Get the original inventory item back
    commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`);

    console.log("Commands (0 inv slots, full inventory, optimized):", commands);
    return commands;
  }

  console.error(
    "Not enough empty slots for same-stash swap - need either 2 inventory slots OR 1 inventory + 1 temp stash slot OR 1 temp stash slot (with full inventory)"
  );
  return commands;
}

/**
 * Swap items between different stashes
 * Uses any available empty slots (inventory or stashes) as temporary storage
 * Optimizes for minimum number of commands
 */
export function swapBetweenStashes(
  from: { stashNumber: number; slot: number },
  to: { stashNumber: number; slot: number },
  data: ParsedLoaderData
): string[] {
  const commands: string[] = [];

  console.log(
    `[swapBetweenStashes] Swapping stash${from.stashNumber} slot${from.slot} <-> stash${to.stashNumber} slot${to.slot}`
  );

  const targetStash = data.stashes.find(
    (s) => s.stashNumber === to.stashNumber
  );
  const targetItem = targetStash?.items.find((item) => item.slot === to.slot);

  if (!targetItem) {
    // Target stash slot is empty - move the item
    const emptyInvSlot = findEmptyInventorySlot(data);

    if (emptyInvSlot) {
      // Simple move via inventory (2 commands)
      console.log(
        `[swapBetweenStashes] Target empty, moving stash${from.stashNumber} slot${from.slot} -> stash${to.stashNumber} via inventory`
      );
      commands.push(`-g${from.stashNumber} ${from.slot}`); // Get to inventory
      commands.push(`-s${to.stashNumber} ${emptyInvSlot}`); // Stash to target
      return commands;
    }

    // No empty inventory - use temp stash slot (4 commands)
    const tempStashSlot = findEmptyStashSlot(
      data,
      from.stashNumber,
      to.stashNumber
    );
    if (!tempStashSlot) {
      console.error(
        "[swapBetweenStashes] Need either 1 empty inventory slot OR 1 temp stash slot for stash-to-stash move"
      );
      return commands;
    }

    console.log(
      `[swapBetweenStashes] Target empty, moving stash${from.stashNumber} slot${from.slot} -> stash${to.stashNumber} via temp stash${tempStashSlot.stashNumber}`
    );
    // 1. Stash any inventory item to temp
    const anyInvItem = data.inventory[0];
    if (!anyInvItem) {
      console.error(
        "[swapBetweenStashes] Need at least 1 inventory item to make temp space"
      );
      return commands;
    }
    commands.push(`-s${tempStashSlot.stashNumber} ${anyInvItem.slot}`); // Make room

    // 2. Get item from source stash
    commands.push(`-g${from.stashNumber} ${from.slot}`);

    // 3. Stash to target
    commands.push(`-s${to.stashNumber} ${anyInvItem.slot}`);

    // 4. Get temp item back
    commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`);

    return commands;
  }

  // Both slots have items - need to swap
  // Strategy 1: Use 2 empty inventory slots (fastest - 4 commands)
  const emptyInvSlot1 = findEmptyInventorySlot(data);
  const emptyInvSlot2 = emptyInvSlot1
    ? findSecondEmptyInventorySlot(data, emptyInvSlot1)
    : null;

  if (emptyInvSlot1 && emptyInvSlot2) {
    console.log(
      `[swapBetweenStashes] Strategy 1: Using 2 empty inventory slots (${emptyInvSlot1}, ${emptyInvSlot2})`
    );
    // Get both items to inventory
    commands.push(`-g${from.stashNumber} ${from.slot}`); // Goes to first empty inv slot
    commands.push(`-g${to.stashNumber} ${to.slot}`); // Goes to second empty inv slot

    // Stash them to swapped locations
    commands.push(`-s${to.stashNumber} ${emptyInvSlot1}`); // Item from 'from' goes to 'to' stash
    commands.push(`-s${from.stashNumber} ${emptyInvSlot2}`); // Item from 'to' goes to 'from' stash

    return commands;
  }

  // Strategy 2: Use 1 empty inventory slot + 1 temp stash slot (6 commands)
  if (emptyInvSlot1) {
    // Find a temp stash slot (not in from/to stashes, to avoid conflicts)
    const tempStashSlot = findEmptyStashSlot(
      data,
      from.stashNumber,
      to.stashNumber
    );

    if (tempStashSlot) {
      console.log(
        `[swapBetweenStashes] Strategy 2: Using 1 inv slot (${emptyInvSlot1}) + temp stash${tempStashSlot.stashNumber} slot${tempStashSlot.slot}`
      );

      // Move 'from' item to inventory
      commands.push(`-g${from.stashNumber} ${from.slot}`);
      // Stash it to temp location
      commands.push(`-s${tempStashSlot.stashNumber} ${emptyInvSlot1}`);

      // Move 'to' item to inventory
      commands.push(`-g${to.stashNumber} ${to.slot}`);
      // Stash it to 'from' location
      commands.push(`-s${from.stashNumber} ${emptyInvSlot1}`);

      // Get temp item back
      commands.push(`-g${tempStashSlot.stashNumber} ${tempStashSlot.slot}`);
      // Stash it to 'to' location
      commands.push(`-s${to.stashNumber} ${emptyInvSlot1}`);

      return commands;
    }
  }

  // Strategy 3: Use 2 temp stash slots when inventory is full (8 commands)
  // Must FIRST make room in inventory before using -g commands
  const tempSlots = findTwoTempStashSlots(
    data,
    from.stashNumber,
    to.stashNumber
  );
  if (!tempSlots) {
    console.error(
      `[swapBetweenStashes] Cannot swap stash${from.stashNumber} slot${from.slot} <-> stash${to.stashNumber} slot${to.slot} - need either:
    - 2 empty inventory slots, OR
    - 1 empty inventory + 1 temp stash slot, OR  
    - 2 temp stash slots (in a different stash)`
    );
    return commands;
  }

  const [tempSlot1, tempSlot2] = tempSlots;
  console.log(
    `[swapBetweenStashes] Strategy 3: Using 2 temp stash slots with full inventory (stash${tempSlot1.stashNumber} slot${tempSlot1.slot}, stash${tempSlot2.stashNumber} slot${tempSlot2.slot})`
  );

  // Step 1: Make room - stash ANY inventory item to temp location
  const anyInvItem = data.inventory[0]; // Get first inventory item
  if (!anyInvItem) {
    console.error(
      "[swapBetweenStashes] Strategy 3 requires at least 1 inventory item to make temp space"
    );
    return commands;
  }

  commands.push(`-s${tempSlot1.stashNumber} ${anyInvItem.slot}`); // Free up 1 inv slot

  // Step 2: Get 'from' item to inventory (now there's room)
  commands.push(`-g${from.stashNumber} ${from.slot}`);
  // Stash it to second temp location
  commands.push(`-s${tempSlot2.stashNumber} ${anyInvItem.slot}`);

  // Step 3: Get 'to' item to inventory
  commands.push(`-g${to.stashNumber} ${to.slot}`);
  // Stash it to 'from' location
  commands.push(`-s${from.stashNumber} ${anyInvItem.slot}`);

  // Step 4: Get temp 'from' item back
  commands.push(`-g${tempSlot2.stashNumber} ${tempSlot2.slot}`);
  // Stash it to 'to' location
  commands.push(`-s${to.stashNumber} ${anyInvItem.slot}`);

  // Step 5: Get original inventory item back
  commands.push(`-g${tempSlot1.stashNumber} ${tempSlot1.slot}`);

  return commands;
}

/**
 * Main swap function that routes to appropriate swap strategy
 */
export function swapStashWithStash(
  from: { stashNumber: number; slot: number },
  to: { stashNumber: number; slot: number },
  data: ParsedLoaderData
): string[] {
  // Check if swapping within same stash
  if (from.stashNumber === to.stashNumber) {
    return swapInSameStash(from, { slot: to.slot }, data);
  } else {
    return swapBetweenStashes(from, to, data);
  }
}

/**
 * Main entry point - calculates swap commands based on location types
 */
export function calculateSwapCommands(
  from: ItemLocation,
  to: ItemLocation,
  data: ParsedLoaderData
): string[] {
  // Inventory to Inventory
  if (from.type === "inventory" && to.type === "inventory") {
    return swapInventoryWithInventory(
      { slot: from.slot },
      { slot: to.slot },
      data
    );
  }

  // Inventory to Stash
  if (from.type === "inventory" && to.type === "stash") {
    return swapInventoryWithStash(
      { slot: from.slot },
      { stashNumber: to.stashNumber, slot: to.slot },
      data
    );
  }

  // Stash to Inventory
  if (from.type === "stash" && to.type === "inventory") {
    return swapStashWithInventory(
      { stashNumber: from.stashNumber, slot: from.slot },
      { slot: to.slot },
      data
    );
  }

  // Stash to Stash
  if (from.type === "stash" && to.type === "stash") {
    return swapStashWithStash(
      { stashNumber: from.stashNumber, slot: from.slot },
      { stashNumber: to.stashNumber, slot: to.slot },
      data
    );
  }

  return [];
}
