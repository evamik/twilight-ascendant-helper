import {
  findWindowByTitle,
  sendEnter,
  sendTextAsync,
  HWND,
} from "../windows/windowsApi";
import { extractLoadCode, splitIntoChunks } from "./loadCodeParser";
import { getLoaderSettings } from "../settings/settings";
import { getCharacterSettings } from "../settings/characterSettings";
import { CharacterData, GameSendResult } from "../types";

let isExecutingCommand = false;

/**
 * Find the Warcraft III window handle
 */
function findWarcraftWindow(): HWND {
  try {
    // Try common Warcraft III window titles
    const possibleTitles = [
      "Warcraft III",
      "Warcraft III: Reforged",
      "Warcraft III: The Frozen Throne",
    ];

    for (const title of possibleTitles) {
      const hwnd = findWindowByTitle(title);
      if (hwnd) {
        return hwnd;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding Warcraft window:", error);
    return null;
  }
}

/**
 * Sends the load sequence to the Warcraft III game window
 * @param characterData - Character data with content
 * @param accountName - Account name (optional, for per-character messages)
 * @param characterName - Character name (optional, for per-character messages)
 */
export async function sendLoadCommand(
  characterData: CharacterData,
  accountName: string | null = null,
  characterName: string | null = null
): Promise<GameSendResult> {
  // Prevent multiple simultaneous executions
  if (isExecutingCommand) {
    return { success: false, error: "Command already in progress" };
  }

  try {
    isExecutingCommand = true;

    // Find the Warcraft III window
    const hwnd = findWarcraftWindow();
    if (!hwnd) {
      return { success: false, error: "Warcraft III window not found" };
    }

    // Extract the load code from character data
    if (!characterData || !characterData.content) {
      return { success: false, error: "No character data provided" };
    }

    const loadCode = extractLoadCode(characterData.content);
    if (!loadCode) {
      return { success: false, error: "Load code not found in character data" };
    }

    // Get loader settings - check for character-specific first, then fallback to global
    let preloadMessages: string[] = [];
    let postloadMessages: string[] = [];

    if (accountName && characterName) {
      const characterSettings = getCharacterSettings(
        accountName,
        characterName
      );
      if (characterSettings) {
        preloadMessages = characterSettings.preloadMessages || [];
        postloadMessages = characterSettings.postloadMessages || [];
      } else {
        const globalSettings = getLoaderSettings();
        preloadMessages = globalSettings.preloadMessages || [];
        postloadMessages = globalSettings.postloadMessages || [];
      }
    } else {
      const globalSettings = getLoaderSettings();
      preloadMessages = globalSettings.preloadMessages || [];
      postloadMessages = globalSettings.postloadMessages || [];
    }

    // Send preload messages (before load command)
    if (preloadMessages && preloadMessages.length > 0) {
      for (const message of preloadMessages) {
        if (message.trim()) {
          sendEnter(hwnd);
          await new Promise<void>((resolve) => setTimeout(resolve, 20));
          await sendTextAsync(hwnd, message.trim(), 5);
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
          sendEnter(hwnd);
          await new Promise<void>((resolve) => setTimeout(resolve, 100)); // Brief pause between messages
        }
      }
    }

    // Step 1: Send -lc command
    sendEnter(hwnd);
    await new Promise<void>((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
    await sendTextAsync(hwnd, "-lc", 5); // 5ms delay per char
    await new Promise<void>((resolve) => setTimeout(resolve, 50)); // Wait for queue to process
    sendEnter(hwnd);

    // Step 2: Send the load code in chunks if necessary
    const maxChunkLength = 124;
    const codeChunks = splitIntoChunks(loadCode, maxChunkLength);

    for (let i = 0; i < codeChunks.length; i++) {
      const chunk = codeChunks[i];

      sendEnter(hwnd);
      await new Promise<void>((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
      await sendTextAsync(hwnd, chunk, 5); // 5ms delay per char
      await new Promise<void>((resolve) =>
        setTimeout(resolve, chunk.length * 5 + 50)
      ); // Wait for queue to process
      sendEnter(hwnd);
    }

    // Step 3: Send -le command
    sendEnter(hwnd);
    await new Promise<void>((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
    await sendTextAsync(hwnd, "-le", 5); // 5ms delay per char
    await new Promise<void>((resolve) => setTimeout(resolve, 50)); // Wait for queue to process
    sendEnter(hwnd);

    // Send postload messages (after load command)
    if (postloadMessages && postloadMessages.length > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 200)); // Wait a bit after -le
      for (const message of postloadMessages) {
        if (message.trim()) {
          sendEnter(hwnd);
          await new Promise<void>((resolve) => setTimeout(resolve, 20));
          await sendTextAsync(hwnd, message.trim(), 5);
          await new Promise<void>((resolve) => setTimeout(resolve, 50));
          sendEnter(hwnd);
          await new Promise<void>((resolve) => setTimeout(resolve, 100)); // Brief pause between messages
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending load command:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    isExecutingCommand = false;
  }
}

/**
 * Send inventory swap commands to Warcraft III
 * @param commands - Array of game commands to send (e.g., ["-s1 2", "-g3 4"])
 */
export async function sendInventoryCommands(
  commands: string[]
): Promise<GameSendResult> {
  if (isExecutingCommand) {
    return { success: false, error: "Command already in progress" };
  }

  try {
    isExecutingCommand = true;

    // Find the Warcraft III window
    const hwnd = findWarcraftWindow();
    if (!hwnd) {
      return {
        success: false,
        error:
          "Warcraft III window not found. Make sure the game is running and in focus.",
      };
    }

    // Send each command with delays
    for (const command of commands) {
      if (command.trim()) {
        sendEnter(hwnd);
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        await sendTextAsync(hwnd, command.trim(), 5);
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
        sendEnter(hwnd);
        await new Promise<void>((resolve) => setTimeout(resolve, 150)); // Wait between commands
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending inventory commands:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    isExecutingCommand = false;
  }
}
