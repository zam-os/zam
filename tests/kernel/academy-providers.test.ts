import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  confirmedProvider,
  confirmProvider,
  listConfirmedProviders,
  parseAcademyProvider,
  providerChange,
  rememberLessonOrigins,
  removeConfirmedProvider,
  reviewSuppressedOrigins,
} from "../../src/kernel/index.js";

const TENANT = "00000000-0000-0000-0000-000000000000";
const API = "11111111-1111-1111-1111-111111111111";
const SHA = "a".repeat(64);

function provider(overrides: Record<string, unknown> = {}) {
  return parseAcademyProvider({
    schema: 1,
    id: "example-provider",
    title: "Example Academy",
    publisher: "Example training department",
    auth: { kind: "entra-cli", tenant: TENANT, api: API },
    feedback: "https://feedback.example/new?tile={tile}",
    ...overrides,
  });
}

describe("confirmed Academy providers (ADR 2026-11-25 D3)", () => {
  let dir: string;
  let config: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-providers-"));
    config = join(dir, "config.json");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("keeps a confirmed provider machine-locally, under its canonical origin", () => {
    confirmProvider(
      {
        origin: "https://Provider.Example/",
        provider: provider(),
        sha256: SHA,
      },
      config,
    );
    const [entry] = listConfirmedProviders(config);
    expect(entry).toMatchObject({
      origin: "https://provider.example",
      sha256: SHA,
      provider: { id: "example-provider" },
    });
    expect(confirmedProvider("example-provider", config)?.origin).toBe(
      "https://provider.example",
    );
    const raw = JSON.parse(readFileSync(config, "utf8"));
    expect(raw.academy.providers).toHaveLength(1);
  });

  it("replaces the entry of the same origin on re-confirmation", () => {
    confirmProvider(
      { origin: "https://provider.example", provider: provider(), sha256: SHA },
      config,
    );
    confirmProvider(
      {
        origin: "https://provider.example",
        provider: provider({ feedback: undefined }),
        sha256: "b".repeat(64),
      },
      config,
    );
    const all = listConfirmedProviders(config);
    expect(all).toHaveLength(1);
    expect(all[0].provider.feedback).toBeNull();
    expect(all[0].sha256).toBe("b".repeat(64));
  });

  it("refuses an id another origin already holds, a reserved id and a bad origin", () => {
    confirmProvider(
      { origin: "https://provider.example", provider: provider(), sha256: SHA },
      config,
    );
    expect(() =>
      confirmProvider(
        { origin: "https://other.example", provider: provider(), sha256: SHA },
        config,
      ),
    ).toThrow(/already confirmed for https:\/\/provider\.example/);
    expect(() =>
      confirmProvider(
        {
          origin: "https://other.example",
          provider: provider({ id: "zam-academy" }),
          sha256: SHA,
        },
        config,
      ),
    ).toThrow(/reserved/);
    expect(() =>
      confirmProvider(
        {
          origin: "http://provider.example",
          provider: provider(),
          sha256: SHA,
        },
        config,
      ),
    ).toThrow(/Provider origin/);
    expect(() =>
      confirmProvider(
        {
          origin: "https://provider.example",
          provider: provider(),
          sha256: "x",
        },
        config,
      ),
    ).toThrow(/SHA-256/);
  });

  it("ignores hand-edited entries that would not pass the checks", () => {
    writeFileSync(
      config,
      JSON.stringify({
        academy: {
          providers: [
            {
              origin: "https://provider.example/path",
              provider: provider(),
              sha256: SHA,
            },
            {
              origin: "https://provider.example",
              provider: {
                ...provider(),
                auth: { kind: "entra-cli", api: "x" },
              },
              sha256: SHA,
            },
            {
              origin: "https://evil.example",
              provider: { ...provider(), id: "de-by" },
              sha256: SHA,
            },
          ],
        },
      }),
    );
    expect(listConfirmedProviders(config)).toEqual([]);
  });

  it("removes a provider", () => {
    confirmProvider(
      { origin: "https://provider.example", provider: provider(), sha256: SHA },
      config,
    );
    expect(removeConfirmedProvider("example-provider", config)).toBe(true);
    expect(removeConfirmedProvider("example-provider", config)).toBe(false);
    expect(listConfirmedProviders(config)).toEqual([]);
  });

  it("names which security-relevant fields changed", () => {
    const confirmed = provider();
    expect(providerChange(confirmed, provider())).toEqual([]);
    expect(providerChange(confirmed, provider({ title: "Renamed" }))).toEqual(
      [],
    );
    expect(
      providerChange(
        confirmed,
        provider({
          auth: { kind: "entra-cli", tenant: TENANT, api: TENANT },
          feedback: "https://other.example/{tile}",
        }),
      ),
    ).toEqual(["auth", "feedback"]);
    expect(providerChange(confirmed, provider({ id: "renamed" }))).toEqual([
      "id",
    ]);
  });

  it("suppresses review fetches for providers and remembered lesson origins", () => {
    confirmProvider(
      { origin: "https://provider.example", provider: provider(), sha256: SHA },
      config,
    );
    rememberLessonOrigins(
      [
        "https://lessons.example/optik/#lesson=1",
        "http://plain.example/x",
        "not a url",
      ],
      config,
    );
    rememberLessonOrigins(["https://lessons.example/other/"], config);
    expect([...reviewSuppressedOrigins(config)].sort()).toEqual([
      "https://lessons.example",
      "https://provider.example",
    ]);
  });
});
