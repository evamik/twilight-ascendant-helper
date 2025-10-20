const { findWindowByTitle, sendEnter, sendTextAsync } = require("./windowsApi");
const { extractLoadCode, splitIntoChunks } = require("./loadCodeParser");
const { getLoaderSettings } = require("./settings");

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

    // Get loader settings for preload/postload messages
    const loaderSettings = getLoaderSettings();
    const { preloadMessages, postloadMessages } = loaderSettings;

    // Send preload messages (before load command)
    if (preloadMessages && preloadMessages.length > 0) {
      console.log(`Sending ${preloadMessages.length} preload message(s)`);
      for (const message of preloadMessages) {
        if (message.trim()) {
          sendEnter(hwnd);
          await new Promise((resolve) => setTimeout(resolve, 20));
          await sendTextAsync(hwnd, message.trim(), 5);
          await new Promise((resolve) => setTimeout(resolve, 50));
          sendEnter(hwnd);
          await new Promise((resolve) => setTimeout(resolve, 100)); // Brief pause between messages
        }
      }
    }

    // Step 1: Send -lc command
    sendEnter(hwnd);
    await new Promise((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
    await sendTextAsync(hwnd, "-lc", 5); // 5ms delay per char
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for queue to process
    sendEnter(hwnd);

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
      await new Promise((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
      await sendTextAsync(hwnd, chunk, 5); // 5ms delay per char
      await new Promise((resolve) =>
        setTimeout(resolve, chunk.length * 5 + 50)
      ); // Wait for queue to process
      sendEnter(hwnd);
    }

    // Step 3: Send -le command
    sendEnter(hwnd);
    await new Promise((resolve) => setTimeout(resolve, 20)); // Wait for text box to be ready
    await sendTextAsync(hwnd, "-le", 5); // 5ms delay per char
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for queue to process
    sendEnter(hwnd);

    // Send postload messages (after load command)
    if (postloadMessages && postloadMessages.length > 0) {
      console.log(`Sending ${postloadMessages.length} postload message(s)`);
      await new Promise((resolve) => setTimeout(resolve, 200)); // Wait a bit after -le
      for (const message of postloadMessages) {
        if (message.trim()) {
          sendEnter(hwnd);
          await new Promise((resolve) => setTimeout(resolve, 20));
          await sendTextAsync(hwnd, message.trim(), 5);
          await new Promise((resolve) => setTimeout(resolve, 50));
          sendEnter(hwnd);
          await new Promise((resolve) => setTimeout(resolve, 100)); // Brief pause between messages
        }
      }
    }

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
