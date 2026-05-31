import { describe, expect, it } from "vitest";
import { detectSystemLocale, normalizeLocale, t } from "../../src/kernel/index.js";

describe("Locale Detection & i18n Translation", () => {
  describe("normalizeLocale", () => {
    it("maps diverse locale strings to ZAM primary supported locales", () => {
      expect(normalizeLocale("de_DE.UTF-8")).toBe("de");
      expect(normalizeLocale("en-US")).toBe("en");
      expect(normalizeLocale("zh_CN")).toBe("zh");
      expect(normalizeLocale("ja-JP.utf8")).toBe("ja");
      expect(normalizeLocale("es_ES")).toBe("es");
      expect(normalizeLocale("fr-FR")).toBe("fr");
      expect(normalizeLocale("pt_BR")).toBe("pt");
    });

    it("defaults to 'en' for unsupported languages", () => {
      expect(normalizeLocale("ru_RU")).toBe("en");
      expect(normalizeLocale("it_IT")).toBe("en");
      expect(normalizeLocale("abc-def")).toBe("en");
    });
  });

  describe("detectSystemLocale", () => {
    it("returns a valid supported locale code", () => {
      const locale = detectSystemLocale();
      const supported = ["en", "de", "es", "fr", "pt", "zh", "ja"];
      expect(supported).toContain(locale);
    });
  });

  describe("t (Translation Formatter)", () => {
    it("interpolates parameters inside translation templates", () => {
      const msgEn = t("en", "welcome", { count: 5 });
      expect(msgEn).toBe("Learning session: 5 card(s)");

      const msgDe = t("de", "welcome", { count: 12 });
      expect(msgDe).toBe("Lern-Session: 12 Karte(n)");

      const msgEs = t("es", "welcome", { count: 3 });
      expect(msgEs).toBe("Sesión de aprendizaje: 3 tarjeta(s)");
    });

    it("falls back to English if target translation key is missing in locale", () => {
      // should fallback gracefully
      const val = t("pt", "quit_hint");
      expect(val).toContain("Ctrl+C");
    });
  });
});
