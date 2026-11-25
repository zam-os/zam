import { describe, expect, it } from "vitest";
import {
  isGuid,
  parseAcademyProvider,
  providerFeedbackUrl,
  providerTokenScope,
  reservedProviderIds,
  tileInNamespace,
} from "../../src/kernel/index.js";

const TENANT = "00000000-0000-0000-0000-000000000000";
const API = "11111111-1111-1111-1111-111111111111";

function file(overrides: Record<string, unknown> = {}) {
  return {
    schema: 1,
    id: "example-provider",
    title: "Example Academy",
    publisher: "Example training department",
    auth: { kind: "entra-cli", tenant: TENANT, api: API },
    feedback:
      "https://feedback.example/new?tile={tile}&item={item}&version={version}",
    ...overrides,
  };
}

describe("parseAcademyProvider", () => {
  it("accepts a valid provider file", () => {
    expect(parseAcademyProvider(file())).toEqual({
      schema: 1,
      id: "example-provider",
      title: "Example Academy",
      publisher: "Example training department",
      auth: { kind: "entra-cli", tenant: TENANT, api: API },
      feedback:
        "https://feedback.example/new?tile={tile}&item={item}&version={version}",
    });
  });

  it("accepts auth none and a missing report link", () => {
    const parsed = parseAcademyProvider(
      file({ auth: { kind: "none" }, feedback: undefined }),
    );
    expect(parsed.auth).toEqual({ kind: "none" });
    expect(parsed.feedback).toBeNull();
  });

  it("lower-cases GUIDs and ignores unknown keys", () => {
    const parsed = parseAcademyProvider(
      file({
        auth: {
          kind: "entra-cli",
          tenant: TENANT,
          api: "ABCDEF01-2345-6789-ABCD-EF0123456789",
        },
        extra: "ignored",
      }),
    );
    expect(parsed.auth).toEqual({
      kind: "entra-cli",
      tenant: TENANT,
      api: "abcdef01-2345-6789-abcd-ef0123456789",
    });
    expect(parsed).not.toHaveProperty("extra");
  });

  it("never takes a scope string from the file", () => {
    const parsed = parseAcademyProvider(
      file({
        auth: {
          kind: "entra-cli",
          tenant: TENANT,
          api: API,
          scope: "https://evil.example/.default & calc",
        },
      }),
    );
    expect(parsed.auth).not.toHaveProperty("scope");
    expect(providerTokenScope(parsed.auth)).toBe(`api://${API}/.default`);
  });

  it.each([
    ["no schema", { schema: 2 }],
    ["an id with a colon", { id: "example:provider" }],
    ["an upper-case id", { id: "Example" }],
    ["a long id", { id: "x".repeat(41) }],
    ["no title", { title: "" }],
    ["a title with a bidi control", { title: "Exa‮mple" }],
    ["a publisher with a newline", { publisher: "Example\nOther" }],
    ["no auth", { auth: undefined }],
    ["an unknown auth kind", { auth: { kind: "password" } }],
    [
      "a tenant that is no GUID",
      { auth: { kind: "entra-cli", tenant: "contoso", api: API } },
    ],
    [
      "an api GUID with shell characters",
      { auth: { kind: "entra-cli", tenant: TENANT, api: `${API}&calc` } },
    ],
    ["an http report link", { feedback: "http://feedback.example/{tile}" }],
    ["an unknown placeholder", { feedback: "https://f.example/{answer}" }],
    ["an empty placeholder", { feedback: "https://f.example/{}" }],
    ["a stray brace", { feedback: "https://f.example/{tile" }],
    ["credentials in the link", { feedback: "https://u:p@f.example/{tile}" }],
    ["a report link that is no URL", { feedback: "not a url" }],
  ])("refuses %s", (_label, overrides) => {
    expect(() => parseAcademyProvider(file(overrides))).toThrow(
      /Provider file/,
    );
  });
});

describe("providerTokenScope", () => {
  it("is null without a login", () => {
    expect(providerTokenScope({ kind: "none" })).toBeNull();
  });

  it("refuses an api that is no GUID", () => {
    expect(() =>
      providerTokenScope({ kind: "entra-cli", tenant: TENANT, api: "x" }),
    ).toThrow(/GUID/);
  });
});

describe("providerFeedbackUrl", () => {
  it("fills only tile, item and version, URL-encoded", () => {
    const provider = parseAcademyProvider(file());
    expect(
      providerFeedbackUrl(provider, {
        tile: "example-provider:lf3",
        item: "01J0000000000000000000ITEM",
        version: "2026.11.1",
      }),
    ).toBe(
      "https://feedback.example/new?tile=example-provider%3Alf3&item=01J0000000000000000000ITEM&version=2026.11.1",
    );
  });

  it("encodes characters that could add parameters", () => {
    const provider = parseAcademyProvider(file());
    const url = providerFeedbackUrl(provider, {
      tile: "a&answer=secret",
      item: "b#c",
      version: "1",
    });
    expect(url).toContain("tile=a%26answer%3Dsecret");
    expect(new URL(url ?? "").searchParams.get("answer")).toBeNull();
  });

  it("is null without a report link", () => {
    expect(
      providerFeedbackUrl(
        { feedback: null },
        { tile: "t", item: "i", version: "1" },
      ),
    ).toBeNull();
  });
});

describe("namespaces", () => {
  it("reserves the public Academy and every bundled prefix", () => {
    const reserved = reservedProviderIds();
    expect(reserved.has("zam-academy")).toBe(true);
    expect(reserved.has("de-by")).toBe(true);
    expect(reserved.has("example-provider")).toBe(false);
  });

  it("matches only the provider's own prefix", () => {
    expect(tileInNamespace("example-provider:lf3", "example-provider")).toBe(
      true,
    );
    expect(tileInNamespace("example-provider-x:lf3", "example-provider")).toBe(
      false,
    );
    expect(tileInNamespace("example-provider:", "example-provider")).toBe(
      false,
    );
    expect(tileInNamespace("zam-academy:uml", "example-provider")).toBe(false);
  });

  it("recognises canonical GUIDs only", () => {
    expect(isGuid(TENANT)).toBe(true);
    expect(isGuid(TENANT.toUpperCase().replace(/0/g, "A"))).toBe(false);
    expect(isGuid(`${TENANT} `)).toBe(false);
  });
});
