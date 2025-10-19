const koffi = require("koffi");

// Load user32.dll
const user32 = koffi.load("user32.dll");

// Define Windows API functions
const FindWindowW = user32.func("FindWindowW", "void*", ["void*", "void*"]);
const SendMessageW = user32.func("SendMessageW", "long", [
  "void*",
  "uint",
  "ulong",
  "long",
]);
const VkKeyScanW = user32.func("VkKeyScanW", "short", ["uint16"]);

// Windows message constants
const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_CHAR = 0x0102;
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
 * Send Enter key
 */
function sendEnter(hwnd) {
  sendKey(hwnd, VK_RETURN);
}

module.exports = {
  findWindowByTitle,
  sendKey,
  sendCharacter,
  sendEnter,
};
