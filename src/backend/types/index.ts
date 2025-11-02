/**
 * Shared TypeScript interfaces for backend
 */

import { BrowserWindow } from "electron";

// Character data interface (shared with frontend)
export interface CharacterData {
  fileName: string;
  content: string;
  [key: string]: any;
}

// Directory result for settings operations
export interface DirectoryResult {
  success: boolean;
  path: string | null;
}

// Generic operation result
export interface OperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Save result for settings
export interface SaveResult {
  success: boolean;
}

// Loader settings
export interface LoaderSettings {
  preloadMessages: string[];
  postloadMessages: string[];
}

// Tag definition
export interface Tag {
  id: string; // Unique ID for the tag
  name: string; // Display name (e.g., "IMP1", "IMP2 HM")
  color: string; // Hex color for the tag (e.g., "#ff9800")
}

// UI settings
export interface UISettings {
  overlayEnabled: boolean;
  showOnlyT4Classes: boolean;
  overlayPosition?: Position; // Saved overlay anchor offset
  overlaySize?: Size; // Saved overlay size
  favoriteCharacters?: string[]; // Array of "accountName:characterName"
  lastUsedAccount?: string; // Last selected account name
  availableTags?: Tag[]; // User-defined tags
  characterTags?: Record<string, string[]>; // Map of "accountName:characterName" to array of tag IDs
}

// Character-specific settings
export interface CharacterSettings {
  preloadMessages?: string[];
  postloadMessages?: string[];
}

// Overlay state
export interface OverlayState {
  overlayEnabled: boolean;
  isDraggingOverlay: boolean;
}

// Position interface
export interface Position {
  x: number;
  y: number;
}

// Size interface
export interface Size {
  width: number;
  height: number;
}

// Bounds interface (position + size)
export interface Bounds extends Position, Size {}

// Drops result
export interface DropsResult {
  success: boolean;
  content?: string;
  error?: string;
}

// Replay result
export interface ReplayResult {
  success: boolean;
  replayPath?: string;
  accountId?: string;
  modifiedTime?: number;
  destinationPath?: string;
  error?: string;
}

// Window info (from active-win)
export interface WindowInfo {
  title: string;
  bounds?: Bounds;
  owner?: {
    name: string;
  };
}

// Game send result
export interface GameSendResult {
  success: boolean;
  error?: string;
}

// Account/Character list results
export type AccountList = string[];
export type CharacterList = string[];

// Character summary (for character list display)
export interface CharacterSummary {
  name: string;
  level: number;
  powerShards: number;
}

export type CharacterSummaryList = CharacterSummary[];

// Backup file info
export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  modifiedDate: string; // ISO date string
  modifiedTime: number; // Unix timestamp for sorting
}

export type BackupFileList = BackupFileInfo[];

// IPC Handler registration function type
export type IpcHandlerRegistration = () => void;

// Window setter function type
export type WindowSetter = (win: BrowserWindow | null) => void;
