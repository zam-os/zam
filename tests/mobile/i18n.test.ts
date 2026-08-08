import { describe, expect, it } from "vitest";
import {
  cardWord,
  getLocale,
  messageKeys,
  resolveLocale,
  setLocale,
  t,
  tf,
} from "../../mobile/src/i18n.js";

describe("resolveLocale", () => {
  it("selects English only for en* tags, German otherwise", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("de-AT")).toBe("de");
    expect(resolveLocale("fr")).toBe("de");
    expect(resolveLocale(null)).toBe("de");
    expect(resolveLocale(undefined)).toBe("de");
  });
});

describe("t / setLocale", () => {
  it("returns strings in the active locale", () => {
    setLocale("de");
    expect(t("reveal_answer")).toBe("Antwort aufdecken");
    setLocale("en");
    expect(t("reveal_answer")).toBe("Reveal answer");
    expect(getLocale()).toBe("en");
    setLocale("de");
  });

  it("falls back to the key when it is unknown", () => {
    expect(t("does_not_exist")).toBe("does_not_exist");
  });
});

describe("tf", () => {
  it("interpolates named params and leaves unknown ones intact", () => {
    setLocale("en");
    expect(tf("queue_summary", { count: 3, cards: "cards" })).toBe(
      "3 cards waiting",
    );
    expect(tf("sync_retry", { attempt: 2 })).toBe(
      "Sync retried (attempt 2): {error}",
    );
    setLocale("de");
  });
});

describe("cardWord", () => {
  it("uses singular for one and plural otherwise", () => {
    setLocale("de");
    expect(cardWord(1)).toBe("Karte");
    expect(cardWord(0)).toBe("Karten");
    expect(cardWord(5)).toBe("Karten");
    setLocale("en");
    expect(cardWord(1)).toBe("card");
    expect(cardWord(2)).toBe("cards");
    setLocale("de");
  });
});

describe("de/en key parity", () => {
  it("defines exactly the same keys in both tables", () => {
    expect(messageKeys("en")).toEqual(messageKeys("de"));
  });
});
