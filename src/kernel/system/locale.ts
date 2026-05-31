import { execSync } from "node:child_process";

export type SupportedLocale = "en" | "de" | "es" | "fr" | "pt" | "zh" | "ja";

const SUPPORTED_LOCALES: Set<SupportedLocale> = new Set([
  "en",
  "de",
  "es",
  "fr",
  "pt",
  "zh",
  "ja",
]);

/**
 * Clean and map raw locale string (e.g., "de_DE.UTF-8" or "en-US") to SupportedLocale.
 */
export function normalizeLocale(raw: string): SupportedLocale {
  const clean = raw.trim().toLowerCase().split(/[_-]/)[0];
  if (SUPPORTED_LOCALES.has(clean as SupportedLocale)) {
    return clean as SupportedLocale;
  }
  return "en";
}

/**
 * Detect the operating system's active language code dynamically.
 */
export function detectSystemLocale(): SupportedLocale {
  try {
    // 1. Check standard POSIX env vars (common on macOS/Linux/Git Bash/WSL)
    const envVars = [
      process.env.LANG,
      process.env.LANGUAGE,
      process.env.LC_ALL,
      process.env.LC_MESSAGES,
    ];

    for (const val of envVars) {
      if (val && val.trim().length > 0) {
        return normalizeLocale(val);
      }
    }

    // 2. On Windows, fallback to querying PowerShell Culture
    if (process.platform === "win32") {
      const output = execSync(
        'powershell -NoProfile -Command "[System.Globalization.CultureInfo]::CurrentCulture.Name"',
        { stdio: "pipe", encoding: "utf8", timeout: 2000 }
      ).trim();
      if (output && output.length > 0) {
        return normalizeLocale(output);
      }
    }
  } catch {
    // Ignore errors and default to English
  }

  return "en";
}
