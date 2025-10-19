const { findWindowByTitle, sendEnter, sendCharacter } = require("./windowsApi");
const { extractLoadCode, splitIntoChunks } = require("./loadCodeParser");

let isExecutingCommand = false;

/**
 * Find the Warcraft III window handle
 */
function findWarcraftWindow() {
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
        console.log(`Found Warcraft III window with title: "${title}"`);
        return hwnd;
      }
    }

    console.log("Warcraft III window not found");
    return null;
  } catch (error) {
    console.error("Error finding Warcraft window:", error);
    return null;
  }
}

/**
 * Sends the load sequence to the Warcraft III game window
 */
async function sendLoadCommand(characterData) {
  // Prevent multiple simultaneous executions
  if (isExecutingCommand) {
    console.log("Command already in progress, skipping...");
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

    console.log("Sending load sequence to Warcraft III");
    console.log("Load code length:", loadCode.length);

    // Step 1: Send -lc command
    sendEnter(hwnd);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const lcCommand = "-lc";
    for (const char of lcCommand) {
      sendCharacter(hwnd, char);
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
    sendEnter(hwnd);

    // Wait a bit before sending the code
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 2: Send the load code in chunks if necessary
    const maxChunkLength = 124;
    const codeChunks = splitIntoChunks(loadCode, maxChunkLength);

    console.log(`Sending code in ${codeChunks.length} chunk(s)`);

    for (let i = 0; i < codeChunks.length; i++) {
      const chunk = codeChunks[i];
      console.log(
        `Sending chunk ${i + 1}/${codeChunks.length}: ${
          chunk.length
        } characters`
      );

      sendEnter(hwnd);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type the chunk character by character
      for (const char of chunk) {
        sendCharacter(hwnd, char);
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
      sendEnter(hwnd);

      // Wait between chunks
      if (i < codeChunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Wait before sending -le
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 3: Send -le command
    sendEnter(hwnd);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const leCommand = "-le";
    for (const char of leCommand) {
      sendCharacter(hwnd, char);
    }

    await new Promise((resolve) => setTimeout(resolve, 20));
    sendEnter(hwnd);

    console.log("Successfully sent load sequence");
    return { success: true };
  } catch (error) {
    console.error("Error sending load command:", error);
    return { success: false, error: error.message };
  } finally {
    isExecutingCommand = false;
  }
}

module.exports = {
  sendLoadCommand,
};
