import { describe, expect, it } from "vitest";
import { dueHeadline } from "../../desktop/src/due-headline.js";
import { setCurrentLocale, t, tf } from "../../desktop/src/i18n.js";

function headline(reviews: number, newCards: number): string {
  return dueHeadline({ reviews, newCards }, { t, tf });
}

describe("dueHeadline", () => {
  it("does not call a card nobody has seen due", () => {
    setCurrentLocale("de");
    expect(headline(0, 10)).toBe("10 neue Karten warten");
    expect(headline(0, 1)).toBe("1 neue Karte wartet");
    expect(headline(0, 10)).not.toMatch(/fällig/);
  });

  it("calls reviews due and names both kinds side by side", () => {
    setCurrentLocale("de");
    expect(headline(3, 0)).toBe("3 Karten sind fällig");
    expect(headline(1, 0)).toBe("1 Karte ist fällig");
    expect(headline(3, 10)).toBe("13 Karten warten: 3 fällig, 10 neu");
    expect(headline(1, 1)).toBe("2 Karten warten: 1 fällig, 1 neu");
    expect(headline(0, 0)).toBe("Gerade ist nichts fällig");
  });

  it("has the same words in English", () => {
    setCurrentLocale("en");
    expect(headline(0, 10)).toBe("10 new cards are waiting");
    expect(headline(3, 10)).toBe("13 cards are waiting: 3 due, 10 new");
  });
});
