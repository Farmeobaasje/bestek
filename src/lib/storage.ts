// ──────────────────────────────────────────────
// localStorage wrapper for ProjectDefinition
// ──────────────────────────────────────────────

import {
  type ProjectDefinition,
  defaultProjectDefinition,
} from "../types/projectDefinition";
import { normalizeProjectDefinition } from "./projectDefinitionParser";

const STORAGE_KEY = "bestek-project-definition";

/**
 * Load a ProjectDefinition from localStorage.
 * Returns the default fallback when nothing is stored or on error.
 * Runs the normalizer to migrate old data (e.g. `mode` → `repositoryState`).
 */
export function loadProjectDefinition(): ProjectDefinition {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProjectDefinition };

    const parsed = JSON.parse(raw);
    // Basic sanity check: must be an object with a `project` key
    if (typeof parsed !== "object" || parsed === null || !parsed.project) {
      return { ...defaultProjectDefinition };
    }

    // Normalize to migrate old data (mode → repositoryState, etc.)
    const result = normalizeProjectDefinition(parsed);
    return result.data;
  } catch {
    return { ...defaultProjectDefinition };
  }
}

/**
 * Persist a ProjectDefinition to localStorage.
 * Silently fails when storage is full or unavailable.
 */
export function saveProjectDefinition(data: ProjectDefinition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Remove the stored ProjectDefinition from localStorage.
 */
export function clearProjectDefinition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

// ── Workspace-wide reset ──────────────────────

/**
 * All known localStorage keys used by Bestek.
 * Keep this list in sync when adding new storage modules.
 */
const ALL_STORAGE_KEYS = [
  "bestek-project-definition",
  "bestek-conversation-memory",
  "bestek-project-requirements",
  "bestek-architecture-analysis",
  "bestek-workspace-state",
];

/**
 * Remove ALL Bestek data from localStorage.
 * This is the nuclear reset — use only for "New Project" / "Reset Workspace".
 *
 * Clears:
 *   - ProjectDefinition
 *   - ConversationMemory
 *   - ProjectRequirements
 *   - ArchitectureAnalysis
 *   - WorkspaceState
 */
export function clearAllStorage(): void {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // fail silently per key
    }
  }
}

// ── Storage migration ─────────────────────────

/**
 * Migrate data from old vibeforge-* keys to new bestek-* keys.
 * Idempotent: never overwrites existing bestek-* keys.
 * Old vibeforge-* keys are NOT deleted — they remain as a fallback.
 *
 * Call once on app startup.
 */
export function migrateStorage(): void {
  const oldToNew: Record<string, string> = {
    "vibeforge-project-definition": "bestek-project-definition",
    "vibeforge-conversation-memory": "bestek-conversation-memory",
    "vibeforge-project-requirements": "bestek-project-requirements",
    "vibeforge-architecture-analysis": "bestek-architecture-analysis",
    "vibeforge-workspace-state": "bestek-workspace-state",
    "vibeforge-theme": "bestek-theme",
    "vibeforge-ai-endpoints": "bestek-ai-endpoints",
    "vibeforge-ai-api-keys": "bestek-ai-api-keys",
    "vibeforge-ai-active-endpoint": "bestek-ai-active-endpoint",
    "vibeforge-ai-assist-mode": "bestek-ai-assist-mode",
  };

  for (const [oldKey, newKey] of Object.entries(oldToNew)) {
    try {
      // Only migrate if the new key doesn't already exist
      if (localStorage.getItem(newKey) === null) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null) {
          localStorage.setItem(newKey, oldValue);
        }
      }
    } catch {
      // fail silently per key
    }
  }
}
