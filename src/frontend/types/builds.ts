/**
 * Build system types for saving and loading inventory builds
 */

export interface BuildSlot {
  slot: number; // 1-6
  itemName: string;
}

export interface Build {
  id: string;
  name: string;
  slots: BuildSlot[]; // Up to 6 items
  createdAt: number;
  updatedAt: number;
}

export interface BuildsData {
  builds: Build[];
  activeBuildId: string | null;
}
