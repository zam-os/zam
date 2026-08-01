import { describe, expect, it } from "vitest";
import {
  BITWARDEN_EU_SIGNUP_URL,
  BITWARDEN_US_SIGNUP_URL,
  bitwardenSignupUrl,
  isAmbiguousBitwardenRegion,
  preferBitwardenEuRegion,
  resolveBitwardenCloudRegion,
} from "../../desktop/src/bitwarden-region.js";

/**
 * Region detection moved out of onboarding with the vault itself (ADR
 * 2026-07-30b, revised): the vault is an alpha, opt-in Settings feature and
 * no longer a first-run page. The EU/US choice still matters once it is
 * switched on — a German school audience must not be defaulted onto a US
 * vault, and the CLI has to target the region the account was created in.
 */

describe("Bitwarden cloud region", () => {
  it("sends Europe-based learners to vault.bitwarden.eu", () => {
    expect(
      preferBitwardenEuRegion({ timeZone: "Europe/Berlin", language: "en" }),
    ).toBe(true);
    expect(
      bitwardenSignupUrl({ timeZone: "Europe/Paris", language: "fr" }),
    ).toBe(BITWARDEN_EU_SIGNUP_URL);
    expect(
      preferBitwardenEuRegion({ timeZone: "Atlantic/Canary", language: "es" }),
    ).toBe(true);
  });

  it("uses German UI language as an EU hint without a Europe timezone", () => {
    expect(
      preferBitwardenEuRegion({ timeZone: "UTC", language: "de" }),
    ).toBe(true);
    expect(bitwardenSignupUrl({ timeZone: "UTC", language: "de-DE" })).toBe(
      BITWARDEN_EU_SIGNUP_URL,
    );
  });

  it("keeps US (and non-EU) learners on vault.bitwarden.com", () => {
    expect(
      preferBitwardenEuRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe(false);
    expect(
      bitwardenSignupUrl({ timeZone: "America/Sao_Paulo", language: "pt" }),
    ).toBe(BITWARDEN_US_SIGNUP_URL);
    // French UI alone is not enough (Canada); timezone must say Europe.
    expect(
      preferBitwardenEuRegion({ timeZone: "America/Toronto", language: "fr" }),
    ).toBe(false);
    expect(
      isAmbiguousBitwardenRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe(false);
    expect(
      resolveBitwardenCloudRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe("us");
  });

  it("asks when detection is ambiguous (e.g. UTC + English)", () => {
    expect(
      isAmbiguousBitwardenRegion({ timeZone: "UTC", language: "en" }),
    ).toBe(true);
    expect(
      resolveBitwardenCloudRegion({ timeZone: "UTC", language: "en" }),
    ).toBeNull();
    // Learner answer wins over ambiguity.
    expect(
      resolveBitwardenCloudRegion({
        timeZone: "UTC",
        language: "en",
        choice: "eu",
      }),
    ).toBe("eu");
    expect(
      bitwardenSignupUrl({
        timeZone: "UTC",
        language: "en",
        choice: "eu",
      }),
    ).toBe(BITWARDEN_EU_SIGNUP_URL);
  });

  it("does not ask when Europe or German UI is already clear", () => {
    expect(
      isAmbiguousBitwardenRegion({
        timeZone: "Europe/Berlin",
        language: "en",
      }),
    ).toBe(false);
    expect(
      isAmbiguousBitwardenRegion({ timeZone: "UTC", language: "de" }),
    ).toBe(false);
    expect(
      resolveBitwardenCloudRegion({ timeZone: "UTC", language: "de" }),
    ).toBe("eu");
  });
});
