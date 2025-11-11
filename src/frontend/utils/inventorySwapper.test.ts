import {
  calculateSwapCommands,
  swapInSameStash,
  swapBetweenStashes,
  swapInventoryWithInventory,
  swapInventoryWithStash,
  swapStashWithInventory,
  findEmptyInventorySlot,
  findSecondEmptyInventorySlot,
  findEmptyStashSlot,
  type ItemLocation,
} from "./inventorySwapper";
import type { ParsedLoaderData } from "./loaderParser";

// Helper function to create test data
function createTestData(
  inventoryItems: number[], // array of slot numbers that have items
  stashItems: { [stashNum: number]: number[] } // stash number -> array of slot numbers with items
): ParsedLoaderData {
  const inventory = inventoryItems.map((slot) => ({
    slot,
    itemName: `Inv Item ${slot}`,
  }));

  const stashes = [];
  for (let stashNum = 1; stashNum <= 6; stashNum++) {
    const items = (stashItems[stashNum] || []).map((slot) => ({
      slot,
      itemName: `Stash${stashNum} Item ${slot}`,
    }));
    stashes.push({
      stashNumber: stashNum,
      items,
    });
  }

  return {
    hero: "TestHero",
    level: "100",
    gold: "1000",
    powerShards: "500",
    playerName: "TestPlayer",
    loadCode: "TEST_LOAD_CODE",
    inventory,
    stashes,
  };
}

// Helper function to simulate commands
function simulateSwapCommand(command: string, data: ParsedLoaderData): void {
  const stashMatch = command.match(/^-s(\d+) (\d+)$/);
  const getMatch = command.match(/^-g(\d+) (\d+)$/);
  const swapMatch = command.match(/^-w(\d+) (\d+)$/);

  if (stashMatch) {
    // -sX Y: Move inventory slot Y to first available in stash X
    const stashNum = parseInt(stashMatch[1]);
    const invSlot = parseInt(stashMatch[2]);
    const invItem = data.inventory.find((item) => item.slot === invSlot);

    if (invItem) {
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
      for (let slot = 1; slot <= 6; slot++) {
        if (!data.inventory.find((item) => item.slot === slot)) {
          data.inventory.push({ slot, itemName: stashItem.itemName });
          stash.items = stash.items.filter((item) => item.slot !== stashSlot);
          break;
        }
      }
    }
  } else if (swapMatch) {
    // -wX Y: Swap inventory slot Y with stash X slot Y
    const stashNum = parseInt(swapMatch[1]);
    const slot = parseInt(swapMatch[2]);
    const invItem = data.inventory.find((item) => item.slot === slot);
    const stash = data.stashes.find((s) => s.stashNumber === stashNum);
    const stashItem = stash?.items.find((item) => item.slot === slot);

    if (invItem && stashItem) {
      const tempName = invItem.itemName;
      invItem.itemName = stashItem.itemName;
      stashItem.itemName = tempName;
    }
  }
}

describe("inventorySwapper", () => {
  describe("Helper functions", () => {
    it("should find first empty inventory slot", () => {
      const data = createTestData([1, 2, 3], {});
      expect(findEmptyInventorySlot(data)).toBe(4);
    });

    it("should return null when inventory is full", () => {
      const data = createTestData([1, 2, 3, 4, 5, 6], {});
      expect(findEmptyInventorySlot(data)).toBe(null);
    });

    it("should find second empty inventory slot", () => {
      const data = createTestData([1, 2], {});
      const first = findEmptyInventorySlot(data);
      expect(first).toBe(3);
      expect(findSecondEmptyInventorySlot(data, first!)).toBe(4);
    });

    it("should find first empty stash slot", () => {
      const data = createTestData([], { 1: [1, 2], 2: [1, 2, 3] });
      const result = findEmptyStashSlot(data);
      expect(result).toEqual({ stashNumber: 1, slot: 3 });
    });
  });

  describe("swapInSameStash", () => {
    it("should swap with 2 empty inventory slots (Strategy 1)", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty inv slots (5, 6)
        { 1: [1, 2, 3, 4] } // stash1 has items in slots 1-4
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 1 },
        { slot: 2 },
        data
      );

      // Should use Strategy 1: 2 empty inventory slots
      // Gets higher slot first (2), then lower slot (1), so they land in correct positions
      expect(commands.length).toBe(4);
      expect(commands).toEqual([
        "-g1 2", // Get item from slot 2 (higher) -> goes to inv slot 5
        "-g1 1", // Get item from slot 1 (lower) -> goes to inv slot 6
        "-s1 5", // Stash inv slot 5 (item from slot 2) -> goes to stash slot 1
        "-s1 6", // Stash inv slot 6 (item from slot 1) -> goes to stash slot 2
      ]);
    });

    it("should swap with 1 empty inventory slot + temp stash (Strategy 2)", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5], // 1 empty inv slot (6)
        {
          1: [1, 2, 3, 4], // stash1 has items in slots 1-4
          2: [1, 2], // stash2 has 4 empty slots (3-6)
        }
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 1 },
        { slot: 2 },
        data
      );

      // Should generate swap commands with temp stash
      expect(commands.length).toBeGreaterThan(4);
      // With only 1 inv slot empty, needs to clear inv slot 1 first
      expect(commands[0]).toMatch(/-s\d+ 1/); // Stash inv slot 1 to temp
    });

    it("should swap with full inventory using temp stash (Strategy 3)", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5, 6], // Full inventory
        {
          1: [1, 2, 3, 4], // stash1 has items in slots 1-4
          2: [1, 2, 3, 4], // stash2 has 2 empty slots (5-6)
        }
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 1 },
        { slot: 2 },
        data
      );

      // Should clear 2 inv slots to temp, swap, then restore
      expect(commands.length).toBe(8);
      // With both stashes having items, may use same stash for temp if slots allow
      expect(commands[0]).toMatch(/-s\d+/); // First clear inv slot 1 to temp
      expect(commands[1]).toMatch(/-s\d+/); // Then clear inv slot 2 to temp
    });

    it("should return empty array when swapping same slot", () => {
      const data = createTestData([1, 2], { 1: [1, 2] });
      const commands = swapInSameStash(
        { stashNumber: 1, slot: 1 },
        { slot: 1 },
        data
      );
      expect(commands).toEqual([]);
    });

    it("should handle swapping slot 1 with slot 2", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty slots
        { 1: [1, 2] }
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 1 },
        { slot: 2 },
        data
      );

      expect(commands.length).toBe(4);
    });

    it("should handle swapping slot 2 with slot 4 in consecutive stash", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty slots
        { 1: [1, 2, 3, 4] } // Consecutive stash slots
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 2 },
        { slot: 4 },
        data
      );

      expect(commands.length).toBeGreaterThan(0); // Should generate swap commands

      // Simulate and verify the swap worked
      for (const cmd of commands) {
        simulateSwapCommand(cmd, data);
      }

      const stash1 = data.stashes.find((s) => s.stashNumber === 1);
      expect(stash1?.items.find((i) => i.slot === 2)?.itemName).toBe(
        "Stash1 Item 4"
      );
      expect(stash1?.items.find((i) => i.slot === 4)?.itemName).toBe(
        "Stash1 Item 2"
      );
    });

    it("should handle swapping slot 5 with slot 3 in consecutive stash", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty slots
        { 1: [1, 2, 3, 4, 5] } // Consecutive stash slots 1-5
      );

      const commands = swapInSameStash(
        { stashNumber: 1, slot: 5 },
        { slot: 3 },
        data
      );

      expect(commands.length).toBeGreaterThan(0); // Should generate swap commands

      // Simulate the commands to update data state
      for (const cmd of commands) {
        simulateSwapCommand(cmd, data);
      }

      // Should swap Item5 and Item3
      const stash1 = data.stashes.find((s) => s.stashNumber === 1);
      expect(stash1?.items.find((i) => i.slot === 3)?.itemName).toBe(
        "Stash1 Item 5"
      );
      expect(stash1?.items.find((i) => i.slot === 5)?.itemName).toBe(
        "Stash1 Item 3"
      );
      expect(stash1?.items.find((i) => i.slot === 1)?.itemName).toBe(
        "Stash1 Item 1"
      ); // Should not be affected
    });
  });

  describe("swapBetweenStashes", () => {
    it("should swap items between different stashes with 2 empty inv slots", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty inv slots
        {
          1: [1, 2],
          2: [1, 2],
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      expect(commands.length).toBe(4);
      expect(commands).toContain("-g1 1"); // Get from stash1
      expect(commands).toContain("-g2 1"); // Get from stash2
    });

    it("should move to empty stash slot", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5], // 1 empty inv slot
        {
          1: [1, 2],
          2: [], // Empty stash
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      // Target is empty, should just move
      expect(commands.length).toBe(2);
      expect(commands[0]).toBe("-g1 1"); // Get from stash1
      expect(commands[1]).toMatch(/-s2/); // Stash to stash2
    });

    it("should move to empty stash slot with full inventory (using temp stash)", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5, 6], // Full inventory
        {
          1: [1, 2],
          2: [], // Target stash empty
          3: [], // Temp stash available
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      // Should use temp stash to make room
      expect(commands.length).toBe(4);
      expect(commands[0]).toMatch(/-s3/); // Stash inv item to temp
      expect(commands[1]).toBe("-g1 1"); // Get from stash1
      expect(commands[2]).toMatch(/-s2/); // Stash to target stash2
      expect(commands[3]).toMatch(/-g3/); // Get temp item back
    });

    it("should use Strategy 2: 1 inv + temp stash when only 1 inv slot available", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5], // Only 1 empty inv slot (6)
        {
          1: [1, 2], // stash1 has items
          2: [1, 2], // stash2 has items
          3: [], // stash3 is empty - can use as temp
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      // Should use strategy with temp stash, may need to clear inv slot first
      expect(commands.length).toBeGreaterThanOrEqual(6);
      expect(commands).toContain("-g1 1"); // Get from stash1
      expect(commands).toContain("-g2 1"); // Get from stash2
    });

    it("should use Strategy 3: 2 temp stash slots when inv is full", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5, 6], // Full inventory
        {
          1: [1, 2, 3], // stash1 has items
          2: [1, 2, 3], // stash2 has items
          3: [], // stash3 empty - use as temp
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      // Strategy 3: Must first make room by stashing inv items, then do the swap
      expect(commands.length).toBe(8);
      expect(commands[0]).toMatch(/-s3/); // First: stash inv item to make room
      expect(commands).toContain("-g1 1"); // Get from stash1
      expect(commands).toContain("-g2 1"); // Get from stash2
    });

    it("should handle full inventory when swapping between stashes", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const data = createTestData(
        [1, 2, 3, 4, 5, 6], // Full inventory
        {
          1: [1, 2, 3, 4, 5, 6], // Full stash1
          2: [1, 2, 3, 4, 5, 6], // Full stash2
          3: [1, 2, 3, 4, 5, 6], // Full stash3
          4: [1, 2, 3, 4, 5, 6], // Full stash4
          5: [1, 2, 3, 4, 5, 6], // Full stash5
          6: [1, 2, 3, 4, 5, 6], // Full stash6
        }
      );

      const commands = swapBetweenStashes(
        { stashNumber: 1, slot: 1 },
        { stashNumber: 2, slot: 1 },
        data
      );

      expect(commands).toEqual([]); // Not enough space
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("swapInventoryWithInventory", () => {
    it("should swap two inventory items using temp stash", () => {
      const data = createTestData(
        [1, 2, 3, 4],
        { 1: [] } // Empty stash for temp
      );

      const commands = swapInventoryWithInventory(
        { slot: 1 },
        { slot: 2 },
        data
      );

      // Gets higher slot first (2), then lower (1), so they swap positions
      expect(commands.length).toBe(4);
      expect(commands[0]).toBe("-s1 2"); // Move higher slot to temp stash
      expect(commands[1]).toBe("-s1 1"); // Move lower slot to temp stash
      expect(commands[2]).toMatch(/-g1/); // Get first item back
      expect(commands[3]).toMatch(/-g1/); // Get second item back
    });

    it("should return empty array when no temp stash available", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const data = createTestData([1, 2], {
        1: [1, 2, 3, 4, 5, 6], // Full stash
        2: [1, 2, 3, 4, 5, 6], // Full stash
        3: [1, 2, 3, 4, 5, 6], // Full stash
        4: [1, 2, 3, 4, 5, 6], // Full stash
        5: [1, 2, 3, 4, 5, 6], // Full stash
        6: [1, 2, 3, 4, 5, 6], // Full stash
      });

      const commands = swapInventoryWithInventory(
        { slot: 1 },
        { slot: 2 },
        data
      );

      expect(commands).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("swapInventoryWithStash", () => {
    it("should stash item to empty slot", () => {
      const data = createTestData([1, 2, 3], { 1: [] });

      const commands = swapInventoryWithStash(
        { slot: 1 },
        { stashNumber: 1, slot: 1 },
        data
      );

      // When slots match, uses -w command
      expect(commands.length).toBe(1);
      expect(commands[0]).toBe("-w1 1");
    });

    it("should swap using -w when slot numbers match", () => {
      const data = createTestData([1, 2, 3], { 1: [1, 2] });

      const commands = swapInventoryWithStash(
        { slot: 1 },
        { stashNumber: 1, slot: 1 },
        data
      );

      expect(commands).toEqual(["-w1 1"]);
    });

    it("should swap with different slot numbers (Strategy 1: with empty inv slot)", () => {
      const data = createTestData(
        [1, 2, 3, 4], // 2 empty slots
        {
          1: [2], // Stash1 has item in slot 2
          2: [], // Empty temp stash
        }
      );

      const commands = swapInventoryWithStash(
        { slot: 1 },
        { stashNumber: 1, slot: 2 },
        data
      );

      // swapInventoryWithStash uses temp stash pattern with 6 commands
      expect(commands.length).toBe(6);
      expect(commands).toContain("-g1 2"); // Get stash item
    });

    it("should swap with full inventory (Strategy 2: using temp stash slot)", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5, 6], // Full inventory
        {
          6: [4], // Stash6 has item in slot 4
          1: [], // Empty stash for temp
        }
      );

      const commands = swapInventoryWithStash(
        { slot: 1 },
        { stashNumber: 6, slot: 4 },
        data
      );

      // swapInventoryWithStash uses 6-command temp stash pattern
      expect(commands.length).toBe(6);
      expect(commands).toContain("-g6 4"); // Get stash item from stash 6 slot 4
    });
  });

  describe("swapStashWithInventory", () => {
    it("should get item to empty inventory slot", () => {
      const data = createTestData(
        [1, 2, 3, 4, 5], // 1 empty slot
        { 1: [1, 2] }
      );

      const commands = swapStashWithInventory(
        { stashNumber: 1, slot: 1 },
        { slot: 6 },
        data
      );

      expect(commands).toEqual(["-g1 1"]);
    });

    it("should swap using -w when slot numbers match", () => {
      const data = createTestData([1, 2, 3], { 1: [1, 2] });

      const commands = swapStashWithInventory(
        { stashNumber: 1, slot: 1 },
        { slot: 1 },
        data
      );

      expect(commands).toEqual(["-w1 1"]);
    });

    it("should swap with different slot numbers", () => {
      const data = createTestData(
        [1, 2, 3], // Slot 4 empty
        {
          1: [1], // Stash1 has item in slot 1
          2: [], // Empty temp stash
        }
      );

      const commands = swapStashWithInventory(
        { stashNumber: 1, slot: 1 },
        { slot: 2 },
        data
      );

      // Should handle swap with different slot numbers
      expect(commands.length).toBeGreaterThanOrEqual(2);
      expect(commands).toContain("-g1 1"); // Get stash item
    });
  });

  describe("calculateSwapCommands - Integration tests", () => {
    it("should route to correct swap function for inv->inv", () => {
      const data = createTestData([1, 2], { 1: [] });
      const from: ItemLocation = { type: "inventory", slot: 1 };
      const to: ItemLocation = { type: "inventory", slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0);
    });

    it("should route to correct swap function for inv->stash", () => {
      const data = createTestData([1, 2], { 1: [] });
      const from: ItemLocation = { type: "inventory", slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0);
      // Slots match, so uses -w command
      expect(commands[0]).toBe("-w1 1");
    });

    it("should route to correct swap function for stash->inv", () => {
      const data = createTestData([1, 2], { 1: [1] });
      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "inventory", slot: 3 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands).toEqual(["-g1 1"]);
    });

    it("should route to correct swap function for stash->stash (same)", () => {
      const data = createTestData([1, 2], { 1: [1, 2] });
      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0);
    });

    it("should route to correct swap function for stash->stash (different)", () => {
      const data = createTestData([1, 2], { 1: [1], 2: [1] });
      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 2, slot: 1 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty inventory", () => {
      const data = createTestData([], { 1: [1, 2] });
      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0);
    });

    it("should handle half-filled inventory", () => {
      const data = createTestData([1, 2, 3], { 1: [1, 2] });
      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBe(4); // Strategy 1: uses 2 empty inv slots
    });

    it("should handle full inventory with random empty stash slots", () => {
      const data = createTestData([1, 2, 3, 4, 5, 6], {
        1: [1, 2, 3, 4], // 2 empty
        2: [1, 3, 5], // 3 empty (slots 2, 4, 6)
        3: [2, 4, 6], // 3 empty (slots 1, 3, 5)
      });

      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands.length).toBeGreaterThan(0); // Should generate swap commands
    });

    it("should handle 1 empty slot in each stash", () => {
      const data = createTestData([1, 2, 3, 4, 5, 6], {
        1: [1, 2, 3, 4, 5], // 1 empty (slot 6)
        2: [1, 2, 3, 4, 5], // 1 empty (slot 6)
        3: [1, 2, 3, 4, 5], // 1 empty (slot 6)
      });

      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      // Should generate commands successfully
      expect(commands.length).toBeGreaterThan(0);
    });

    it("should handle completely full stashes and inventory", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const data = createTestData([1, 2, 3, 4, 5, 6], {
        1: [1, 2, 3, 4, 5, 6],
        2: [1, 2, 3, 4, 5, 6],
        3: [1, 2, 3, 4, 5, 6],
        4: [1, 2, 3, 4, 5, 6],
        5: [1, 2, 3, 4, 5, 6],
        6: [1, 2, 3, 4, 5, 6],
      });

      const from: ItemLocation = { type: "stash", stashNumber: 1, slot: 1 };
      const to: ItemLocation = { type: "stash", stashNumber: 1, slot: 2 };

      const commands = calculateSwapCommands(from, to, data);
      expect(commands).toEqual([]); // Impossible - no free slots
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
