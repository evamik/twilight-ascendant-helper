/**
 * Parser for Twilight Ascendant loader.txt file
 * Extracts structured character data from the Preload() function format
 */

export interface InventorySlot {
  slot: number;
  itemName: string;
}

export interface StashData {
  stashNumber: number;
  items: InventorySlot[];
}

export interface ParsedLoaderData {
  playerName: string;
  hero: string;
  level: string; // Extracted from filename like "[Level 300].txt"
  gold: string;
  powerShards: string;
  inventory: InventorySlot[];
  stashes: StashData[];
  loadCode: string;
}

/**
 * Parse loader.txt content into structured data
 */
export function parseLoaderContent(
  content: string,
  fileName?: string
): ParsedLoaderData | null {
  if (!content) return null;

  const lines = content.split("\n");
  const preloadLines: string[] = [];

  // Extract all Preload() call contents
  for (const line of lines) {
    const match = line.match(/call Preload\(\s*"([^"]*)"\s*\)/);
    if (match) {
      preloadLines.push(match[1]);
    }
  }

  if (preloadLines.length === 0) return null;

  // Extract level from filename like "[Level 300].txt"
  let level = "";
  if (fileName) {
    const levelMatch = fileName.match(/\[Level (\d+)\]/);
    if (levelMatch) {
      level = levelMatch[1];
    }
  }

  // Initialize result
  const result: ParsedLoaderData = {
    playerName: "",
    hero: "",
    level: level,
    gold: "",
    powerShards: "",
    inventory: [],
    stashes: [],
    loadCode: "",
  };

  // Parse each line
  for (const line of preloadLines) {
    // Skip empty lines
    if (line.trim() === "") continue;

    // Player Name
    if (line.startsWith("Player Name:")) {
      result.playerName = line.replace("Player Name:", "").trim();
      continue;
    }

    // Hero
    if (line.startsWith("Hero:")) {
      result.hero = line.replace("Hero:", "").trim();
      continue;
    }

    // Gold
    if (line.startsWith("Gold:")) {
      result.gold = line.replace("Gold:", "").trim();
      continue;
    }

    // Power Shards
    if (line.startsWith("Power Shards:")) {
      result.powerShards = line.replace("Power Shards:", "").trim();
      continue;
    }

    // Inventory items (Item 1-6)
    const invMatch = line.match(/^Item (\d+):\s*(.*)$/);
    if (invMatch) {
      const slot = parseInt(invMatch[1], 10);
      const itemName = invMatch[2].trim();
      if (itemName) {
        result.inventory.push({ slot, itemName });
      }
      continue;
    }

    // Stash items (Stash1-6 Item 1-6)
    const stashMatch = line.match(/^Stash(\d+) Item (\d+):\s*(.*)$/);
    if (stashMatch) {
      const stashNum = parseInt(stashMatch[1], 10);
      const slot = parseInt(stashMatch[2], 10);
      const itemName = stashMatch[3].trim();

      // Find or create stash
      let stash = result.stashes.find((s) => s.stashNumber === stashNum);
      if (!stash) {
        stash = { stashNumber: stashNum, items: [] };
        result.stashes.push(stash);
      }

      if (itemName) {
        stash.items.push({ slot, itemName });
      }
      continue;
    }

    // Load code (starts with -l)
    if (line.startsWith("-l ")) {
      result.loadCode = line;
      continue;
    }
  }

  // Sort stashes by number
  result.stashes.sort((a, b) => a.stashNumber - b.stashNumber);

  return result;
}
