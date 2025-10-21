import * as koffi from "koffi";

// Type for window handle (void pointer) - using any for koffi interop
export type HWND = any;

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

// Windows message constants
const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_CHAR = 0x0102;
const WM_SETTEXT = 0x000c;
const EM_REPLACESEL = 0x00c2;
const VK_RETURN = 0x0d;

/**
 * Find a window by title
 */
export function findWindowByTitle(title: string): HWND {
  const titleBuffer = Buffer.from(title + "\0", "ucs2");
  const hwnd = FindWindowW(null, titleBuffer);
  return hwnd && hwnd !== 0 ? hwnd : null;
}

/**
 * Send a key down/up message
 */
export function sendKey(hwnd: HWND, vkCode: number): void {
  SendMessageW(hwnd, WM_KEYDOWN, vkCode, 0);
  SendMessageW(hwnd, WM_KEYUP, vkCode, 0);
}

/**
 * Send a character with full key sequence
 */
export function sendCharacter(hwnd: HWND, char: string): void {
  const charCode = char.charCodeAt(0);
  const vk = VkKeyScanW(charCode) & 0xff;

  SendMessageW(hwnd, WM_KEYDOWN, vk, 0);
  SendMessageW(hwnd, WM_CHAR, charCode, 0);
  SendMessageW(hwnd, WM_KEYUP, vk, 0);
}

/**
 * PostMessageW is much faster as it doesn't wait for processing
 * @param hwnd - Window handle
 * @param char - Single character to send
 */
export async function sendCharacterAsync(
  hwnd: HWND,
  char: string
): Promise<void> {
  const charCode = char.charCodeAt(0);
  PostMessageW(hwnd, WM_CHAR, charCode, 0);
}

/**
 * Send a string of characters asynchronously using PostMessageW
 * Much faster than SendMessageW as it doesn't wait for each message to be processed
 * @param hwnd - Window handle
 * @param text - Text to send
 * @param charDelay - Delay between characters in milliseconds (adjust for reliability)
 */
export async function sendTextAsync(
  hwnd: HWND,
  text: string,
  charDelay: number = 5
): Promise<void> {
  for (const char of text) {
    await sendCharacterAsync(hwnd, char);
    if (charDelay > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, charDelay));
    }
  }
}

/**
 * Send Enter key using PostMessageW (async version)
 */
export async function sendEnterAsync(hwnd: HWND): Promise<void> {
  PostMessageW(hwnd, WM_CHAR, VK_RETURN, 0);
}

/**
 * Send Enter key
 */
export function sendEnter(hwnd: HWND): void {
  sendKey(hwnd, VK_RETURN);
}

/**
 * Attempt to set text directly using WM_SETTEXT (may not work for games)
 * @param hwnd - Window handle
 * @param text - Text to set
 * @returns Result from SendMessageW
 */
export function setWindowText(hwnd: HWND, text: string): number {
  const textBuffer = Buffer.from(text + "\0", "ucs2");
  return SendMessageWPtr(hwnd, WM_SETTEXT, 0, textBuffer);
}

/**
 * Attempt to insert text using EM_REPLACESEL (for edit controls)
 * @param hwnd - Window handle
 * @param text - Text to insert
 * @returns Result from SendMessageW
 */
export function insertText(hwnd: HWND, text: string): number {
  const textBuffer = Buffer.from(text + "\0", "ucs2");
  return SendMessageWPtr(hwnd, EM_REPLACESEL, 1, textBuffer);
}

// Result type for tryAllTextMethods
export interface TextMethodResults {
  settext: number | string;
  replacesel: number | string;
}

/**
 * Try multiple methods to send text (for testing which works)
 * @param hwnd - Window handle
 * @param text - Text to send
 * @returns Results from each method
 */
export function tryAllTextMethods(hwnd: HWND, text: string): TextMethodResults {
  const results: TextMethodResults = {
    settext: 0,
    replacesel: 0,
  };

  // Method 1: WM_SETTEXT
  try {
    results.settext = setWindowText(hwnd, text);
  } catch (e) {
    results.settext = `Error: ${(e as Error).message}`;
  }

  // Method 2: EM_REPLACESEL
  try {
    results.replacesel = insertText(hwnd, text);
  } catch (e) {
    results.replacesel = `Error: ${(e as Error).message}`;
  }

  return results;
}
