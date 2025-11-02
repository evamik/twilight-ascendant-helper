/**
 * Shared TypeScript interfaces for frontend components
 */

export interface CharacterData {
  fileName: string;
  content: string;
  name?: string;
  level?: number;
  class?: string;
  [key: string]: any;
}

export interface Account {
  name: string;
}

export interface Character {
  name: string;
}

export interface CharacterSummary {
  name: string;
  level: number;
  powerShards: number;
}

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  modifiedDate: string;
  modifiedTime: number;
}
