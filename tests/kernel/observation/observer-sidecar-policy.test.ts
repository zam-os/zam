import { describe, expect, it } from "vitest";
import { toSidecarPrivacyPolicy } from "../../../src/kernel/observation/observer-sidecar-policy.js";
import {
  DEFAULT_OBSERVER_POLICY,
  type ObserverPolicy,
} from "../../../src/kernel/observation/policy.js";

function policy(overrides: Partial<ObserverPolicy> = {}): ObserverPolicy {
  return { ...DEFAULT_OBSERVER_POLICY, ...overrides };
}

describe("toSidecarPrivacyPolicy", () => {
  it("maps an empty policy to empty lists", () => {
    expect(toSidecarPrivacyPolicy(policy())).toEqual({
      allowProcesses: [],
      denyProcesses: [],
      denyTitleMarkers: [],
    });
  });

  it("maps the allowlist to allowProcesses", () => {
    const mapped = toSidecarPrivacyPolicy(
      policy({ allowlist: ["calculator", "notepad"] }),
    );
    expect(mapped.allowProcesses).toEqual(["calculator", "notepad"]);
  });

  it("feeds a denylist term into both process and title-marker lists", () => {
    const mapped = toSidecarPrivacyPolicy(policy({ denylist: ["signal"] }));
    expect(mapped.denyProcesses).toEqual(["signal"]);
    expect(mapped.denyTitleMarkers).toEqual(["signal"]);
  });

  it("does not alias the source policy arrays", () => {
    const source = policy({ denylist: ["signal"] });
    const mapped = toSidecarPrivacyPolicy(source);
    mapped.denyProcesses.push("teams");
    expect(source.denylist).toEqual(["signal"]);
  });
});
