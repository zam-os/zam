/**
 * Machine-local complexity preference for the native Desktop Settings view.
 *
 * Settings start in the simple view. Advanced is an explicit learner choice
 * and stays on this device, just like the theme; it is presentation state, not
 * learning data that belongs in the shared database.
 */

export type SettingsViewMode = "simple" | "advanced";

export const SETTINGS_VIEW_MODE_STORAGE_KEY = "zam:settings-view-mode";

export function parseSettingsViewMode(value: unknown): SettingsViewMode {
  return value === "advanced" ? "advanced" : "simple";
}

export function loadSettingsViewMode(
  storage: Pick<Storage, "getItem"> = localStorage,
): SettingsViewMode {
  try {
    return parseSettingsViewMode(
      storage.getItem(SETTINGS_VIEW_MODE_STORAGE_KEY),
    );
  } catch {
    return "simple";
  }
}

export function saveSettingsViewMode(
  mode: SettingsViewMode,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(SETTINGS_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // A blocked storage backend must not make Settings unusable. The selected
    // view still applies for this page; only persistence is lost.
  }
}

export const AGENTIC_CODING_MODE_STORAGE_KEY = "zam:agentic-coding-mode";

export function parseAgenticCodingMode(value: unknown): boolean {
  return value === "true" || value === true;
}

export function loadAgenticCodingMode(
  storage: Pick<Storage, "getItem"> = localStorage,
): boolean {
  try {
    return parseAgenticCodingMode(
      storage.getItem(AGENTIC_CODING_MODE_STORAGE_KEY),
    );
  } catch {
    return false;
  }
}

export function saveAgenticCodingMode(
  enabled: boolean,
  storage: Pick<Storage, "setItem"> = localStorage,
): void {
  try {
    storage.setItem(
      AGENTIC_CODING_MODE_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  } catch {
    // Storage may be blocked; keep in-memory state for this session.
  }
}

/**
 * Agentic Coding (Alpha) requires AI mode ("advanced") to be active.
 */
export function isAgenticCodingEffective(
  viewMode: SettingsViewMode,
  agenticCodingEnabled: boolean,
): boolean {
  return viewMode === "advanced" && agenticCodingEnabled;
}
