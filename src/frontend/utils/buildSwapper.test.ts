import { generateBuildSwapCommands } from "./buildSwapper";
import type { ParsedLoaderData } from "./loaderParser";
import type { Build } from "../types/builds";

describe("buildSwapper", () => {
  // Helper to create test data
  const createTestData = (
    inventoryItems: Array<{ slot: number; itemName: string }>,
    stashItems: Array<{ stashNumber: number; slot: number; itemName: string }>
  ): ParsedLoaderData => {
    const stashes = [];
    for (let i = 1; i <= 6; i++) {
      stashes.push({
        stashNumber: i,
        items: stashItems
          .filter((item) => item.stashNumber === i)
          .map((item) => ({ slot: item.slot, itemName: item.itemName })),
      });
    }

    return {
      inventory: inventoryItems.map((item) => ({
        slot: item.slot,
        itemName: item.itemName,
      })),
      stashes,
      playerName: "TestPlayer",
      hero: "Test Hero",
      level: "100",
      gold: "0",
      powerShards: "0",
      loadCode: "",
    } as ParsedLoaderData;
  };

  const createBuild = (
    name: string,
    slots: Array<{ slot: number; itemName: string }>
  ): Build => ({
    id: "test-build",
    name,
    slots,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  describe("Basic build application", () => {
    it("should apply a full 6-item build when items are in stash 1", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "CurrentItem1" },
          { slot: 2, itemName: "CurrentItem2" },
          { slot: 3, itemName: "CurrentItem3" },
          { slot: 4, itemName: "CurrentItem4" },
          { slot: 5, itemName: "CurrentItem5" },
          { slot: 6, itemName: "CurrentItem6" },
        ],
        [
          { stashNumber: 1, slot: 1, itemName: "BuildItem1" },
          { stashNumber: 1, slot: 2, itemName: "BuildItem2" },
          { stashNumber: 1, slot: 3, itemName: "BuildItem3" },
          { stashNumber: 1, slot: 4, itemName: "BuildItem4" },
          { stashNumber: 1, slot: 5, itemName: "BuildItem5" },
          { stashNumber: 1, slot: 6, itemName: "BuildItem6" },
        ]
      );

      const build = createBuild("Test Build", [
        { slot: 1, itemName: "BuildItem1" },
        { slot: 2, itemName: "BuildItem2" },
        { slot: 3, itemName: "BuildItem3" },
        { slot: 4, itemName: "BuildItem4" },
        { slot: 5, itemName: "BuildItem5" },
        { slot: 6, itemName: "BuildItem6" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);
      console.log("Final stash 1:", data.stashes[0].items);

      // Should have 6 items in inventory after swap
      expect(data.inventory.length).toBe(6);
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "BuildItem2"
      );
      expect(data.inventory.find((i) => i.slot === 3)?.itemName).toBe(
        "BuildItem3"
      );
      expect(data.inventory.find((i) => i.slot === 4)?.itemName).toBe(
        "BuildItem4"
      );
      expect(data.inventory.find((i) => i.slot === 5)?.itemName).toBe(
        "BuildItem5"
      );
      expect(data.inventory.find((i) => i.slot === 6)?.itemName).toBe(
        "BuildItem6"
      );

      // Old items should be in stash 1
      expect(data.stashes[0].items.length).toBe(6);
    });

    it("should handle build with empty slots", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "Item1" },
          { slot: 2, itemName: "Item2" },
          { slot: 3, itemName: "Item3" },
        ],
        [{ stashNumber: 1, slot: 1, itemName: "BuildItem1" }]
      );

      const build = createBuild("Partial Build", [
        { slot: 1, itemName: "BuildItem1" },
        // slots 2-6 empty
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);

      // Should have BuildItem1 in slot 1
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );

      // Slots 2-3 should be empty (items moved to stash)
      expect(data.inventory.find((i) => i.slot === 2)).toBeUndefined();
      expect(data.inventory.find((i) => i.slot === 3)).toBeUndefined();
    });

    it("should skip slots that already have correct items", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "BuildItem1" },
          { slot: 2, itemName: "WrongItem" },
        ],
        [{ stashNumber: 1, slot: 1, itemName: "BuildItem2" }]
      );

      const build = createBuild("Partial Match", [
        { slot: 1, itemName: "BuildItem1" },
        { slot: 2, itemName: "BuildItem2" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);

      // Should only swap slot 2 (slot 1 already correct)
      expect(commands.length).toBeGreaterThan(0);
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "BuildItem2"
      );
    });

    it("should handle swapping items between inventory slots", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "ItemA" },
          { slot: 2, itemName: "ItemB" },
        ],
        []
      );

      const build = createBuild("Swap Build", [
        { slot: 1, itemName: "ItemB" },
        { slot: 2, itemName: "ItemA" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);

      // Items should be swapped
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe("ItemB");
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe("ItemA");
    });

    it("should handle build with all empty slots (clear inventory)", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "Item1" },
          { slot: 2, itemName: "Item2" },
          { slot: 3, itemName: "Item3" },
        ],
        []
      );

      const build = createBuild("Empty Build", []);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);

      // All items should be moved to stash
      expect(data.inventory.length).toBe(0);
    });

    it("should handle complex scenario with items scattered across stashes", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "Current1" },
          { slot: 2, itemName: "Current2" },
          { slot: 3, itemName: "Current3" },
          { slot: 4, itemName: "Current4" },
          { slot: 5, itemName: "Current5" },
          { slot: 6, itemName: "Current6" },
        ],
        [
          { stashNumber: 1, slot: 1, itemName: "BuildItem1" },
          { stashNumber: 2, slot: 3, itemName: "BuildItem2" },
          { stashNumber: 3, slot: 5, itemName: "BuildItem3" },
          { stashNumber: 4, slot: 2, itemName: "BuildItem4" },
          { stashNumber: 5, slot: 4, itemName: "BuildItem5" },
          { stashNumber: 6, slot: 6, itemName: "BuildItem6" },
        ]
      );

      const build = createBuild("Scattered Build", [
        { slot: 1, itemName: "BuildItem1" },
        { slot: 2, itemName: "BuildItem2" },
        { slot: 3, itemName: "BuildItem3" },
        { slot: 4, itemName: "BuildItem4" },
        { slot: 5, itemName: "BuildItem5" },
        { slot: 6, itemName: "BuildItem6" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);

      // Should have all build items in correct slots
      expect(data.inventory.length).toBe(6);
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "BuildItem2"
      );
      expect(data.inventory.find((i) => i.slot === 3)?.itemName).toBe(
        "BuildItem3"
      );
      expect(data.inventory.find((i) => i.slot === 4)?.itemName).toBe(
        "BuildItem4"
      );
      expect(data.inventory.find((i) => i.slot === 5)?.itemName).toBe(
        "BuildItem5"
      );
      expect(data.inventory.find((i) => i.slot === 6)?.itemName).toBe(
        "BuildItem6"
      );
    });

    it("should handle 5-item build (slot 6 empty) without leaving extra empty slot", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "Current1" },
          { slot: 2, itemName: "Current2" },
          { slot: 3, itemName: "Current3" },
          { slot: 4, itemName: "Current4" },
          { slot: 5, itemName: "Current5" },
          { slot: 6, itemName: "Current6" },
        ],
        [
          { stashNumber: 1, slot: 1, itemName: "BuildItem1" },
          { stashNumber: 1, slot: 2, itemName: "BuildItem2" },
          { stashNumber: 1, slot: 3, itemName: "BuildItem3" },
          { stashNumber: 1, slot: 4, itemName: "BuildItem4" },
          { stashNumber: 1, slot: 5, itemName: "BuildItem5" },
        ]
      );

      const build = createBuild("5 Item Build", [
        { slot: 1, itemName: "BuildItem1" },
        { slot: 2, itemName: "BuildItem2" },
        { slot: 3, itemName: "BuildItem3" },
        { slot: 4, itemName: "BuildItem4" },
        { slot: 5, itemName: "BuildItem5" },
        // slot 6 should be empty
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);
      console.log("Inventory length:", data.inventory.length);

      // Should have exactly 5 items in inventory
      expect(data.inventory.length).toBe(5);
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "BuildItem2"
      );
      expect(data.inventory.find((i) => i.slot === 3)?.itemName).toBe(
        "BuildItem3"
      );
      expect(data.inventory.find((i) => i.slot === 4)?.itemName).toBe(
        "BuildItem4"
      );
      expect(data.inventory.find((i) => i.slot === 5)?.itemName).toBe(
        "BuildItem5"
      );
      expect(data.inventory.find((i) => i.slot === 6)).toBeUndefined();
    });

    it("should handle real scenario: Imp3 -> Imp2 HM (bug reproduction)", () => {
      // Starting state: Imp3 build applied
      const data = createTestData(
        [
          { slot: 1, itemName: "Savior" },
          { slot: 2, itemName: "Staff of Celestial Grace" },
          { slot: 3, itemName: "Chalice of the Life" },
          { slot: 4, itemName: "Infernal Wyrmplate" },
          { slot: 5, itemName: "Wrath of Melitele" },
          { slot: 6, itemName: "Grace of Melitele" },
        ],
        [
          { stashNumber: 1, slot: 1, itemName: "Grimoire of Eternity" },
          { stashNumber: 1, slot: 2, itemName: "Soulheart of Ruin" },
          { stashNumber: 1, slot: 3, itemName: "Hellstone Keystone" },
          { stashNumber: 1, slot: 4, itemName: "Lore" },
          { stashNumber: 2, slot: 1, itemName: "Prism of Draconic Unity" },
          { stashNumber: 2, slot: 2, itemName: "Aspect of Dragons" },
          { stashNumber: 2, slot: 3, itemName: "Aspect of Storm" },
          { stashNumber: 2, slot: 4, itemName: "Aspect of Storm" },
          { stashNumber: 2, slot: 5, itemName: "Royal Neptunes" },
        ]
      );

      // Target: Imp2 HM build
      const build = createBuild("Imp2 HM", [
        { slot: 1, itemName: "Soulheart of Ruin" },
        { slot: 2, itemName: "Staff of Celestial Grace" },
        { slot: 3, itemName: "Chalice of the Life" },
        { slot: 4, itemName: "Infernal Wyrmplate" },
        { slot: 5, itemName: "Royal Neptunes" },
        { slot: 6, itemName: "Grace of Melitele" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);
      console.log("Inventory length:", data.inventory.length);

      // Should have exactly 6 items in inventory
      expect(data.inventory.length).toBe(6);
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "Soulheart of Ruin"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "Staff of Celestial Grace"
      );
      expect(data.inventory.find((i) => i.slot === 3)?.itemName).toBe(
        "Chalice of the Life"
      );
      expect(data.inventory.find((i) => i.slot === 4)?.itemName).toBe(
        "Infernal Wyrmplate"
      );
      expect(data.inventory.find((i) => i.slot === 5)?.itemName).toBe(
        "Royal Neptunes"
      );
      expect(data.inventory.find((i) => i.slot === 6)?.itemName).toBe(
        "Grace of Melitele"
      );
    });

    it("should keep displaced items in same stash as build items came from", () => {
      const data = createTestData(
        [
          { slot: 1, itemName: "CurrentItem1" },
          { slot: 2, itemName: "CurrentItem2" },
          { slot: 3, itemName: "CurrentItem3" },
        ],
        [
          { stashNumber: 2, slot: 1, itemName: "BuildItem1" },
          { stashNumber: 2, slot: 2, itemName: "BuildItem2" },
          { stashNumber: 2, slot: 3, itemName: "BuildItem3" },
        ]
      );

      const build = createBuild("Stash 2 Build", [
        { slot: 1, itemName: "BuildItem1" },
        { slot: 2, itemName: "BuildItem2" },
        { slot: 3, itemName: "BuildItem3" },
      ]);

      const commands = generateBuildSwapCommands(build, data);

      console.log("Commands:", commands);
      console.log("Final inventory:", data.inventory);
      console.log(
        "Stash 2:",
        data.stashes.find((s) => s.stashNumber === 2)?.items
      );

      // Build items should be in inventory
      expect(data.inventory.find((i) => i.slot === 1)?.itemName).toBe(
        "BuildItem1"
      );
      expect(data.inventory.find((i) => i.slot === 2)?.itemName).toBe(
        "BuildItem2"
      );
      expect(data.inventory.find((i) => i.slot === 3)?.itemName).toBe(
        "BuildItem3"
      );

      // Displaced inventory items should be in stash 2 (where build items came from)
      const stash2 = data.stashes.find((s) => s.stashNumber === 2);
      expect(
        stash2?.items.find((i) => i.itemName === "CurrentItem1")
      ).toBeDefined();
      expect(
        stash2?.items.find((i) => i.itemName === "CurrentItem2")
      ).toBeDefined();
      expect(
        stash2?.items.find((i) => i.itemName === "CurrentItem3")
      ).toBeDefined();
    });
  });
});
