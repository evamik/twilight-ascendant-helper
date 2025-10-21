/**
 * Parser for Twilight Ascendant drops.txt file
 * Extracts structured data from the Preload() function format
 */

export interface ItemDrop {
  itemName: string; // e.g., "Veilshard"
  className?: string; // Class when item dropped (for repicks)
}

export interface PlayerDrop {
  playerName: string; // e.g., "RawrMcRawr#1115"
  className: string; // e.g., "Grand Templar" or "Champion → Hierophant"
  items: ItemDrop[]; // Array of item drops with class context
}

export interface ParsedDropsData {
  gameId: string;
  duration: string; // e.g., "82.323 minutes"
  sessionId: string;
  players: PlayerDrop[];
}

/**
 * Remove WC3 color codes from text
 * Format: |cffFFFFFF text |r
 */
function removeColorCodes(text: string): string {
  return text.replace(/\|cff[A-Fa-f0-9]{6}/g, "").replace(/\|r/g, "");
}

/**
 * Parse drops.txt content into structured data
 */
export function parseDropsContent(content: string): ParsedDropsData | null {
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

  // Initialize result
  const result: ParsedDropsData = {
    gameId: "",
    duration: "",
    sessionId: "",
    players: [],
  };

  // Map to track player data as we parse
  const playerMap = new Map<
    string,
    { classes: string[]; items: Array<{ itemName: string; className: string }> }
  >();

  let currentPlayer: string | null = null;
  let currentClass: string | null = null;

  for (const line of preloadLines) {
    // Game ID
    if (line.startsWith("Game ID:")) {
      result.gameId = line.replace("Game ID:", "").trim();
      continue;
    }

    // Duration
    if (line.startsWith("Duration:")) {
      result.duration = line.replace("Duration:", "").trim();
      continue;
    }

    // Session
    if (line.startsWith("Session:")) {
      result.sessionId = line.replace("Session:", "").trim();
      continue;
    }

    // Skip headers and footers
    if (
      line.includes("===") ||
      line === "Players:" ||
      line.startsWith("Thanks for playing") ||
      line === "in Discord."
    ) {
      continue;
    }

    // Player line (starts with spaces but not excessive indentation)
    if (line.match(/^\s{2}[^\s]/) && line.includes("#") && line.includes("(")) {
      // Extract player name and class
      // Format: "  RawrMcRawr#1115 (Grand Templar)"
      const playerMatch = line.match(/^\s+([^(]+)\(([^)]+)\)/);
      if (playerMatch) {
        const playerName = playerMatch[1].trim();
        const className = playerMatch[2].trim();

        currentPlayer = playerName;
        currentClass = className;

        if (!playerMap.has(playerName)) {
          playerMap.set(playerName, { classes: [], items: [] });
        }

        const playerData = playerMap.get(playerName)!;
        if (!playerData.classes.includes(className)) {
          playerData.classes.push(className);
        }
      }
      continue;
    }

    // Items line (starts with more spaces)
    if (line.match(/^\s{4,}Items:/)) {
      if (currentPlayer && currentClass) {
        // Extract item names (remove color codes)
        const itemsText = line.replace(/^\s+Items:\s*/, "");
        const cleanItem = removeColorCodes(itemsText).trim();

        if (cleanItem) {
          const playerData = playerMap.get(currentPlayer)!;
          // Store item with its class (we'll decide later if we show it)
          playerData.items.push({
            itemName: cleanItem,
            className: currentClass,
          });
        }
      }
      continue;
    }

    // Skip Times and Score lines
    if (line.match(/^\s+Times:/) || line.match(/^\s+Score:/)) {
      continue;
    }
  }

  // Convert map to player array
  for (const [playerName, data] of playerMap.entries()) {
    // Format class name (show transition if multiple classes)
    let className = "";
    if (data.classes.length > 1) {
      // Show class transition: "Champion → Hierophant"
      className = data.classes.reverse().join(" → ");
    } else {
      className = data.classes[0] || "";
    }

    // Map items - only show class if player has multiple classes (repicked)
    const items: ItemDrop[] = data.items.map((item) => ({
      itemName: item.itemName,
      className: data.classes.length > 1 ? item.className : undefined,
    }));

    result.players.push({
      playerName,
      className,
      items,
    });
  }

  return result;
}
