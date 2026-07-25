import { describe, expect, it } from "vitest";
import { classifyServerDbError } from "../../desktop/src/server-db.js";
import { setCurrentLocale } from "../../desktop/src/i18n.js";

// Issue #218 acceptance criterion: "clear errors for missing network, invalid
// token, or free-tier limits". The bridge passes the driver's raw English text
// through, so the panel classifies it into something a learner can act on.
describe("classifyServerDbError", () => {
  it("recognizes network failures", () => {
    for (const raw of [
      "getaddrinfo ENOTFOUND your-db.turso.io",
      "connect ECONNREFUSED 127.0.0.1:8080",
      "fetch failed",
      "request timed out: ETIMEDOUT",
    ]) {
      expect(classifyServerDbError(raw)).toBe(
        "No connection to the database host. Check your network, then try again.",
      );
    }
  });

  it("recognizes rejected tokens", () => {
    for (const raw of [
      "Server returned HTTP status 401",
      "Unauthorized: invalid token",
      "authentication failed",
    ]) {
      expect(classifyServerDbError(raw)).toMatch(/rejected this token/);
    }
  });

  it("recognizes quota refusals", () => {
    for (const raw of [
      "quota exceeded for this organization",
      "HTTP 429 Too Many Requests",
      "monthly storage limit exceeded",
    ]) {
      expect(classifyServerDbError(raw)).toMatch(/over quota/);
    }
  });

  it("keeps the raw detail for anything unrecognized", () => {
    const text = classifyServerDbError("table cards has no column named foo");
    expect(text).toContain("table cards has no column named foo");
  });

  it("localizes the classified message", () => {
    setCurrentLocale("de");
    try {
      expect(classifyServerDbError("getaddrinfo ENOTFOUND host")).toBe(
        "Keine Verbindung zum Datenbank-Host. Prüfe dein Netzwerk und versuche es erneut.",
      );
    } finally {
      setCurrentLocale("en");
    }
  });
});
