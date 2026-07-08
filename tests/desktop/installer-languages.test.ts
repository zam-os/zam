import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ZAM's 7 standard languages (src/kernel/system/locale.ts) mapped to the NSIS
// language identifiers Tauri ships translations for. English is first: NSIS
// falls back to the first listed language when the OS language isn't included.
const EXPECTED_NSIS_LANGUAGES = [
  "English", // en
  "German", // de
  "Spanish", // es
  "French", // fr
  "Portuguese", // pt
  "SimpChinese", // zh
  "Japanese", // ja
];

// The NSIS languages Tauri bundles translations for, verified against
// crates/tauri-bundler/src/bundle/windows/nsis/languages on the dev branch.
const TAURI_SUPPORTED_NSIS_LANGUAGES = new Set([
  "Arabic",
  "Bulgarian",
  "Dutch",
  "English",
  "French",
  "German",
  "Hebrew",
  "Italian",
  "Japanese",
  "Korean",
  "Norwegian",
  "Persian",
  "Portuguese",
  "PortugueseBR",
  "Russian",
  "SimpChinese",
  "Spanish",
  "SpanishInternational",
  "Swedish",
  "TradChinese",
  "Turkish",
  "Ukrainian",
  "Vietnamese",
]);

interface TauriConfig {
  bundle?: {
    windows?: {
      nsis?: {
        languages?: string[];
        displayLanguageSelector?: boolean;
      };
    };
  };
}

function readTauriConfig(): TauriConfig {
  const path = join(process.cwd(), "desktop", "src-tauri", "tauri.conf.json");
  return JSON.parse(readFileSync(path, "utf8")) as TauriConfig;
}

describe("Windows NSIS installer localization", () => {
  it("configures all 7 ZAM languages in order (English first as fallback)", () => {
    const nsis = readTauriConfig().bundle?.windows?.nsis;
    expect(nsis?.languages).toEqual(EXPECTED_NSIS_LANGUAGES);
  });

  it("uses only NSIS identifiers Tauri ships translations for", () => {
    const langs = readTauriConfig().bundle?.windows?.nsis?.languages ?? [];
    for (const lang of langs) {
      expect(TAURI_SUPPORTED_NSIS_LANGUAGES.has(lang)).toBe(true);
    }
  });

  it("covers exactly one installer language per supported locale (7, no duplicates)", () => {
    const langs = readTauriConfig().bundle?.windows?.nsis?.languages ?? [];
    expect(langs).toHaveLength(7);
    expect(new Set(langs).size).toBe(7);
  });

  it("auto-detects the OS language without showing a picker", () => {
    const nsis = readTauriConfig().bundle?.windows?.nsis;
    expect(nsis?.displayLanguageSelector).toBe(false);
    expect(nsis?.languages?.[0]).toBe("English");
  });
});
