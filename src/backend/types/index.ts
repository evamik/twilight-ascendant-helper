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

// UI settings
export interface UISettings {
  overlayEnabled: boolean;
  showOnlyT4Classes: boolean;
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

// IPC Handler registration function type
export type IpcHandlerRegistration = () => void;

// Window setter function type
export type WindowSetter = (win: BrowserWindow | null) => void;
