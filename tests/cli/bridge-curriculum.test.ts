import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  ensureCard,
  getCard,
  openDatabase,
} from "../../src/kernel/index.js";

describe("bridge curriculum-* commands", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-curriculum-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-curriculum-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  });

  function runBridge(args: string[]): unknown {
    const env = { ...process.env, USERPROFILE: tempHome, HOME: tempHome };
    const out = execFileSync("node", [cliPath, "bridge", ...args], {
      env,
      cwd: tempCwd,
      encoding: "utf-8",
    });
    return JSON.parse(out);
  }

  function runBridgeError(args: string[]): { error: string } {
    const env = { ...process.env, USERPROFILE: tempHome, HOME: tempHome };
    try {
      execFileSync("node", [cliPath, "bridge", ...args], {
        env,
        cwd: tempCwd,
        encoding: "utf-8",
      });
      throw new Error("expected bridge command to fail");
    } catch (err) {
      const fail = err as { stdout?: string; message?: string };
      const raw = (fail.stdout ?? fail.message ?? "").trim();
      const jsonStart = raw.indexOf("{");
      return JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw);
    }
  }

  it("lists the registered LehrplanPLUS Bayern provider", () => {
    const result = runBridge(["curriculum-list-providers"]) as {
      success: boolean;
      providers: Array<{ id: string; country: string; region: string }>;
    };
    expect(result.success).toBe(true);
    expect(result.providers).toContainEqual({
      id: "lehrplanplus-bayern",
      country: "DE",
      countryLabel: "Deutschland",
      region: "BY",
      regionLabel: "Bayern",
      label: "LehrplanPLUS (Bayern)",
    });
  });

  it("walks all six wizard levels down to a concrete Lernbereich", () => {
    const schoolTypes = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "schoolType",
    ]) as { success: boolean; options: Array<{ id: string }> };
    expect(schoolTypes.options.map((o) => o.id)).toContain("realschule");

    const grades = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "grade",
      "--selection",
      JSON.stringify({ schoolType: "realschule" }),
    ]) as { options: Array<{ id: string }> };
    expect(grades.options.map((o) => o.id)).toContain("9");

    const subjects = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "subject",
      "--selection",
      JSON.stringify({ schoolType: "realschule", grade: "9" }),
    ]) as { options: Array<{ id: string }> };
    expect(subjects.options.map((o) => o.id)).toContain("mathematik");

    const tracks = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "track",
      "--selection",
      JSON.stringify({
        schoolType: "realschule",
        grade: "9",
        subject: "mathematik",
      }),
    ]) as { options: Array<{ id: string; label: string }> };
    expect(tracks.options).toEqual([
      {
        id: "wpfg1",
        label: "Mathematik 9 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 9 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);

    const topics = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "topic",
      "--selection",
      JSON.stringify({
        schoolType: "realschule",
        grade: "9",
        subject: "mathematik",
        track: "wpfg1",
      }),
    ]) as { options: Array<{ id: string; label: string }> };
    expect(topics.options).toHaveLength(8);
    expect(topics.options[0]).toMatchObject({ label: "Reelle Zahlen" });
  });

  it("resolves selected topics to their LehrplanPLUS source URLs (batch)", () => {
    const topics = runBridge([
      "curriculum-list-level",
      "--provider",
      "lehrplanplus-bayern",
      "--level",
      "topic",
      "--selection",
      JSON.stringify({
        schoolType: "realschule",
        grade: "9",
        subject: "deutsch",
      }),
    ]) as { options: Array<{ id: string; label: string; sourceRef: string }> };

    const resolved = runBridge([
      "curriculum-resolve-topics",
      "--provider",
      "lehrplanplus-bayern",
      "--topics",
      JSON.stringify(topics.options.slice(0, 2)),
    ]) as {
      success: boolean;
      resolved: Array<{ provider: string; topicId: string; uri: string }>;
    };

    expect(resolved.resolved).toHaveLength(2);
    expect(resolved.resolved[0].topicId).toBe("realschule|9|deutsch#lb1");
    expect(resolved.resolved[0].uri).toBe(resolved.resolved[1].uri);
    expect(resolved.resolved[0].uri).toContain(
      "/schulart/realschule/jgs/9/fach/deutsch/",
    );
  });

  it("marks an unverified Bremen topic missing and offers Bayern", () => {
    const selection = {
      schoolType: "oberschule",
      grade: "7",
      subject: "mathematik",
    };
    const topics = runBridge([
      "curriculum-list-level",
      "--provider",
      "bildungsplan-bremen",
      "--level",
      "topic",
      "--selection",
      JSON.stringify(selection),
    ]) as {
      options: Array<{
        id: string;
        label: string;
        sourceRef: string;
        contentStatus: string;
      }>;
    };
    const topic = topics.options.find(
      (candidate) => candidate.id === "arithmetik-algebra",
    )!;
    expect(topic.contentStatus).toBe("missing");

    const readiness = runBridge([
      "curriculum-topic-readiness",
      "--provider",
      "bildungsplan-bremen",
      "--topic",
      JSON.stringify(topic),
      "--selection",
      JSON.stringify(selection),
    ]) as {
      status: string;
      reason: string;
      alternatives: Array<{
        providerId: string;
        regionLabel: string;
        sourceUris: string[];
      }>;
    };

    expect(readiness).toMatchObject({
      status: "missing",
      reason: "unverified_source",
    });
    expect(readiness.alternatives).toEqual([
      expect.objectContaining({
        providerId: "lehrplanplus-bayern",
        regionLabel: "Bayern",
        sourceUris: expect.arrayContaining([
          expect.stringContaining("https://www.lehrplanplus.bayern.de/"),
        ]),
      }),
    ]);
  });

  it("rejects an unknown provider", () => {
    expect(() =>
      runBridge([
        "curriculum-list-level",
        "--provider",
        "nope",
        "--level",
        "schoolType",
      ]),
    ).toThrow();
  });

  it("round-trips the last navigated breadcrumb through the bridge", () => {
    const before = runBridge(["curriculum-get-last-selection"]) as {
      success: boolean;
      breadcrumb: unknown;
    };
    expect(before.breadcrumb).toBeNull();

    const setResult = runBridge([
      "curriculum-set-last-selection",
      "--breadcrumb",
      JSON.stringify({
        providerId: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: "9",
        subject: "mathematik",
        track: "wpfg1",
      }),
    ]) as { success: boolean };
    expect(setResult.success).toBe(true);

    const after = runBridge(["curriculum-get-last-selection"]) as {
      breadcrumb: {
        providerId: string;
        schoolType: string;
        grade: string;
        subject: string;
        track: string;
      };
    };
    expect(after.breadcrumb).toEqual({
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    });
  });

  it("curriculum-list-subtopics returns JSON errors for invalid topics", () => {
    const result = runBridgeError([
      "curriculum-list-subtopics",
      "--provider",
      "lehrplanplus-bayern",
      "--topic",
      '{"id":"x","sourceRef":"bad"}',
    ]);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toMatch(/^file:\/\//);
  });

  it("curriculum-confirm-topic rejects removals outside curriculum scope", async () => {
    const dbDir = join(tempHome, ".zam");
    mkdirSync(dbDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dbDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(db, {
      slug: "other-scope-card",
      concept: "Outside curriculum scope",
      domain: "test",
      provider: "other-provider",
      topic_id: "elsewhere|9|topic#lb1",
    });
    await ensureCard(db, token.id, "thomas");
    await db.close();

    const result = runBridgeError([
      "curriculum-confirm-topic",
      "--provider",
      "lehrplanplus-bayern",
      "--topicId",
      "realschule|9|deutsch#lb1",
      "--sourceId",
      "unused-source",
      "--create",
      "[]",
      "--removeSlugs",
      JSON.stringify(["other-scope-card"]),
      "--user",
      "thomas",
    ]);

    expect(result.error).toContain("not removable");

    const verifyDb = await openDatabase({
      dbPath: join(dbDir, "zam.db"),
      initialize: false,
      useConfiguredCloud: false,
    });
    const card = await getCard(verifyDb, token.id, "thomas");
    expect(card).not.toBeNull();
    await verifyDb.close();
  });

  it("reuses cached web curriculum content without fetching it again", async () => {
    const dbDir = join(tempHome, ".zam");
    mkdirSync(dbDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dbDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT INTO sources (id, type, uri, content) VALUES (?, 'web', ?, ?)",
      )
      .run(
        "cached-curriculum-source",
        "http://127.0.0.1/curriculum",
        "Cached official curriculum",
      );
    await db.close();

    const result = runBridge([
      "personal-source-import",
      "--type",
      "web",
      "--uri",
      "http://127.0.0.1/curriculum",
    ]) as {
      success: boolean;
      sourceId: string;
      content: string;
      cached: boolean;
    };

    expect(result).toEqual({
      success: true,
      sourceId: "cached-curriculum-source",
      content: "Cached official curriculum",
      cached: true,
    });
  });
});
