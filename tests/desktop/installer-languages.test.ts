import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "../../desktop/src/i18n.js";

// NSIS identifier for each ZAM locale. Keyed as Record<Locale, string> so that
// adding a locale to LOCALES (desktop/src/i18n.ts) fails compilation here until
// an installer mapping exists — keeping setup.exe in parity with the app.
const NSIS_LANGUAGE_BY_LOCALE: Record<Locale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "SimpChinese",
  ja: "Japanese",
};

// The NSIS languages Tauri ships translations for — hand-checked against
// crates/tauri-bundler/src/bundle/windows/nsis/languages (dev branch and the
// resolved @tauri-apps/cli 2.11.x, 2026-07-08). PR CI never runs makensis (only
// the tag-triggered release build does), so this membership check is the
// pipeline's pre-release guard against typo'd identifiers.
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

interface NsisConfig {
  languages?: string[];
  displayLanguageSelector?: boolean;
}

/** The `bundle.windows.nsis` block exactly as the Tauri bundler reads it. */
function readNsisConfig(): NsisConfig {
  const raw = readFileSync(
    join(process.cwd(), "desktop", "src-tauri", "tauri.conf.json"),
    "utf8",
  );
  return JSON.parse(raw).bundle?.windows?.nsis ?? {};
}

describe("Windows NSIS installer localization", () => {
  const nsis = readNsisConfig();

  it("configures one NSIS language per ZAM locale, English first as fallback", () => {
    expect(nsis.languages).toEqual(
      LOCALES.map((locale) => NSIS_LANGUAGE_BY_LOCALE[locale]),
    );
    expect(nsis.languages?.[0]).toBe("English");
    // Distinct entries — catches a copy-paste duplicate inside the mapping.
    expect(new Set(nsis.languages).size).toBe(LOCALES.length);
  });

  it("uses only NSIS identifiers Tauri ships translations for", () => {
    const languages = nsis.languages ?? [];
    expect(languages.length).toBeGreaterThan(0);
    for (const lang of languages) {
      expect(TAURI_SUPPORTED_NSIS_LANGUAGES.has(lang)).toBe(true);
    }
  });

  it("auto-detects the OS language without showing a picker", () => {
    expect(nsis.displayLanguageSelector).toBe(false);
  });
});
