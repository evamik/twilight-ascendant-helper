const koffi = require("koffi");

// Load user32.dll
const user32 = koffi.load("user32.dll");

// Define Windows API functions (synchronous)
const FindWindowW = user32.func("FindWindowW", "void*", ["void*", "void*"]);
const SendMessageW = user32.func("SendMessageW", "long", [
  "void*",
  "uint",
  "ulong",
  "long",
]);
const SendMessageWPtr = user32.func("SendMessageW", "long", [
  "void*",
  "uint",
  "ulong",
  "void*",
]);
const VkKeyScanW = user32.func("VkKeyScanW", "short", ["uint16"]);

// Define Windows API functions (asynchronous)
// PostMessageW is truly async - returns immediately without waiting for the window to process
const PostMessageW = user32.func("PostMessageW", "int", [
  "void*",
  "uint",
  "ulong",
  "long",
]);

// SendMessageW with async wrapper for Koffi
const SendMessageWAsync = user32.func(
  "SendMessageW",
  "long",
  ["void*", "uint", "ulong", "long"],
  { async: true }
);

// Windows message constants
const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_CHAR = 0x0102;
const WM_SETTEXT = 0x000c;
const EM_REPLACESEL = 0x00c2;
const VK_RETURN = 0x0d;
const VK_CONTROL = 0x11;
const VK_V = 0x56;

/**
 * Find a window by title
 */
function findWindowByTitle(title) {
  const titleBuffer = Buffer.from(title + "\0", "ucs2");
  const hwnd = FindWindowW(null, titleBuffer);
  return hwnd && hwnd !== 0 ? hwnd : null;
}

/**
 * Send a key down/up message
 */
function sendKey(hwnd, vkCode) {
  SendMessageW(hwnd, WM_KEYDOWN, vkCode, 0);
  SendMessageW(hwnd, WM_KEYUP, vkCode, 0);
}

/**
 * Send a character with full key sequence
 */
function sendCharacter(hwnd, char) {
  const charCode = char.charCodeAt(0);
  const vk = VkKeyScanW(charCode) & 0xff;

  SendMessageW(hwnd, WM_KEYDOWN, vk, 0);
  SendMessageW(hwnd, WM_CHAR, charCode, 0);
  SendMessageW(hwnd, WM_KEYUP, vk, 0);
}

/**
 * PostMessageW is much faster as it doesn't wait for processing
 * @param {*} hwnd - Window handle
 * @param {string} char - Single character to send
 */
async function sendCharacterAsync(hwnd, char) {
  const charCode = char.charCodeAt(0);
  const vk = VkKeyScanW(charCode) & 0xff;

  PostMessageW(hwnd, WM_CHAR, charCode, 0);
}

/**
 * Send a string of characters asynchronously using PostMessageW
 * Much faster than SendMessageW as it doesn't wait for each message to be processed
 * @param {*} hwnd - Window handle
 * @param {string} text - Text to send
 * @param {number} charDelay - Delay between characters in milliseconds (adjust for reliability)
 */
async function sendTextAsync(hwnd, text, charDelay = 5) {
  for (const char of text) {
    await sendCharacterAsync(hwnd, char, 0);
    if (charDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, charDelay));
    }
  }
}

/**
 * Send Enter key using PostMessageW (async version)
 */
async function sendEnterAsync(hwnd) {
  PostMessageW(hwnd, WM_CHAR, VK_RETURN, 0);
}

/**
 * Send Enter key
 */
function sendEnter(hwnd) {
  sendKey(hwnd, VK_RETURN);
}

/**
 * Attempt to set text directly using WM_SETTEXT (may not work for games)
 * @param {*} hwnd - Window handle
 * @param {string} text - Text to set
 * @returns {number} - Result from SendMessageW
 */
function setWindowText(hwnd, text) {
  const textBuffer = Buffer.from(text + "\0", "ucs2");
  return SendMessageWPtr(hwnd, WM_SETTEXT, 0, textBuffer);
}

/**
 * Attempt to insert text using EM_REPLACESEL (for edit controls)
 * @param {*} hwnd - Window handle
 * @param {string} text - Text to insert
 * @returns {number} - Result from SendMessageW
 */
function insertText(hwnd, text) {
  const textBuffer = Buffer.from(text + "\0", "ucs2");
  return SendMessageWPtr(hwnd, EM_REPLACESEL, 1, textBuffer);
}

/**
 * Try multiple methods to send text (for testing which works)
 * @param {*} hwnd - Window handle
 * @param {string} text - Text to send
 * @returns {Object} - Results from each method
 */
function tryAllTextMethods(hwnd, text) {
  const results = {};

  // Method 1: WM_SETTEXT
  try {
    results.settext = setWindowText(hwnd, text);
  } catch (e) {
    results.settext = `Error: ${e.message}`;
  }

  // Method 2: EM_REPLACESEL
  try {
    results.replacesel = insertText(hwnd, text);
  } catch (e) {
    results.replacesel = `Error: ${e.message}`;
  }

  return results;
}

module.exports = {
  findWindowByTitle,
  sendKey,
  sendCharacter,
  sendCharacterAsync,
  sendTextAsync,
  sendEnter,
  sendEnterAsync,
  setWindowText,
  insertText,
  tryAllTextMethods,
};
