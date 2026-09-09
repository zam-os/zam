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
