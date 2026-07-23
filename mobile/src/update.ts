/**
 * Sideload update channel for the Android companion.
 *
 * GitHub Releases publish `mobile-latest.json` + a versioned APK. The native
 * plugin downloads the APK and hands it to the system package installer.
 */

export const DEFAULT_MOBILE_UPDATE_MANIFEST =
  "https://github.com/zam-os/zam/releases/latest/download/mobile-latest.json";

export interface AppVersionInfo {
  versionName: string;
  versionCode: number;
}

export interface MobileUpdateInfo {
  version: string;
  versionCode: number;
  url: string;
  notes: string;
  currentVersionName: string;
  currentVersionCode: number;
  updateAvailable: boolean;
}

/** Parse "1.2.3" / "v1.2.3" into numeric parts (missing = 0). */
export function parseSemver(value: string): number[] {
  return value
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

/** True when remote is strictly newer than current. */
export function isNewerVersion(remote: string, current: string): boolean {
  const r = parseSemver(remote);
  const c = parseSemver(current);
  const len = Math.max(r.length, c.length);
  for (let i = 0; i < len; i += 1) {
    const rv = r[i] ?? 0;
    const cv = c[i] ?? 0;
    if (rv !== cv) return rv > cv;
  }
  return false;
}

/**
 * Monotonic Android versionCode from a semver, using Tauri's derivation for
 * the installed APK (major*1000000 + minor*1000 + patch — see AndroidConfig
 * `version_code` in tauri-utils). The manifest and the installed
 * BuildConfig.VERSION_CODE must share this scheme, or the
 * `versionCode > current` update check never fires.
 * 0.16.1 → 16001; 1.2.3 → 1002003.
 */
export function versionCodeFromSemver(version: string): number {
  const [major = 0, minor = 0, patch = 0] = parseSemver(version);
  return major * 1_000_000 + minor * 1_000 + patch;
}

export function buildMobileLatestManifest(input: {
  version: string;
  apkUrl: string;
  notes?: string;
}): {
  version: string;
  versionCode: number;
  url: string;
  notes: string;
} {
  return {
    version: input.version.replace(/^v/i, ""),
    versionCode: versionCodeFromSemver(input.version),
    url: input.apkUrl,
    notes: input.notes ?? "",
  };
}
