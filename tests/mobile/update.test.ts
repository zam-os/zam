import { describe, expect, it } from "vitest";
import {
  buildMobileLatestManifest,
  isNewerVersion,
  parseSemver,
  versionCodeFromSemver,
} from "../../mobile/src/update.js";

describe("parseSemver / isNewerVersion", () => {
  it("parses v-prefixed versions", () => {
    expect(parseSemver("v0.16.1")).toEqual([0, 16, 1]);
  });

  it("detects newer releases", () => {
    expect(isNewerVersion("0.16.2", "0.16.1")).toBe(true);
    expect(isNewerVersion("0.16.1", "0.16.1")).toBe(false);
    expect(isNewerVersion("0.15.9", "0.16.0")).toBe(false);
    expect(isNewerVersion("1.0.0", "0.99.0")).toBe(true);
  });
});

describe("versionCodeFromSemver", () => {
  it("encodes a monotonic code for Android", () => {
    expect(versionCodeFromSemver("0.16.1")).toBe(1601);
    expect(versionCodeFromSemver("v1.2.3")).toBe(10203);
  });
});

describe("buildMobileLatestManifest", () => {
  it("builds the release asset payload", () => {
    expect(
      buildMobileLatestManifest({
        version: "v0.16.2",
        apkUrl:
          "https://github.com/zam-os/zam/releases/download/v0.16.2/ZAM_Mobile_0.16.2_aarch64.apk",
        notes: "sideload channel",
      }),
    ).toEqual({
      version: "0.16.2",
      versionCode: 1602,
      url: "https://github.com/zam-os/zam/releases/download/v0.16.2/ZAM_Mobile_0.16.2_aarch64.apk",
      notes: "sideload channel",
    });
  });
});
