import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  discardStagedImport,
  getPendingImportsDir,
  listStagedImports,
  readStagedImport,
  STAGED_IMPORT_TTL_DAYS,
  stageMaterialImport,
} from "../../src/cli/material-staging.js";

/**
 * Machine-local staging for material imports (ADR 2026-10-05 Decision 2):
 * proposals wait as files until the learner decides them, never as rows.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as unknown;

describe("material import staging", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-pending-imports-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("defaults to ~/.zam/pending-imports and honours the env override", () => {
    expect(getPendingImportsDir()).toBe(
      join(homedir(), ".zam", "pending-imports"),
    );
    process.env.ZAM_PENDING_IMPORTS_DIR = dir;
    try {
      expect(getPendingImportsDir()).toBe(dir);
    } finally {
      delete process.env.ZAM_PENDING_IMPORTS_DIR;
    }
  });

  it("stages a valid set atomically and reads it back", async () => {
    const batch = await stageMaterialImport(
      { set: FIXTURE, origin: "harness", harness: "opencode" },
      { dir },
    );
    expect(readdirSync(dir)).toEqual([`${batch.id}.json`]);
    const read = await readStagedImport(batch.id, { dir });
    expect(read).toMatchObject({
      id: batch.id,
      origin: "harness",
      harness: "opencode",
    });
    expect(read?.set.proposals).toHaveLength(4);
    // The batch describes the material; it never contains it.
    const raw = readFileSync(join(dir, `${batch.id}.json`), "utf8");
    expect(raw).not.toMatch(/base64|data:image/);
  });

  it("refuses an invalid set before writing anything", async () => {
    await expect(
      stageMaterialImport({ set: { version: 1 }, origin: "studio" }, { dir }),
    ).rejects.toThrow(/Invalid material proposals/);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("lists newest first and drops expired and unreadable batches", async () => {
    const day = 24 * 60 * 60 * 1000;
    const start = new Date("2026-10-01T10:00:00.000Z");
    const old = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir, now: () => start },
    );
    const newer = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir, now: () => new Date(start.getTime() + day) },
    );
    writeFileSync(join(dir, "01JUNREADABLE0000000000000.json"), "{oops");

    const soon = () => new Date(start.getTime() + 2 * day);
    expect(
      (await listStagedImports({ dir, now: soon })).map((b) => b.id),
    ).toEqual([newer.id, old.id]);
    expect(existsSync(join(dir, "01JUNREADABLE0000000000000.json"))).toBe(
      false,
    );

    const later = () =>
      new Date(start.getTime() + (STAGED_IMPORT_TTL_DAYS + 0.5) * day);
    expect(
      (await listStagedImports({ dir, now: later })).map((b) => b.id),
    ).toEqual([newer.id]);
    expect(existsSync(join(dir, `${old.id}.json`))).toBe(false);
    expect(await readStagedImport(old.id, { dir, now: later })).toBeNull();
  });

  it("discards a batch and rejects ids that could escape the directory", async () => {
    const batch = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir },
    );
    expect(await discardStagedImport(batch.id, { dir })).toBe(true);
    expect(await discardStagedImport(batch.id, { dir })).toBe(false);
    await expect(readStagedImport("../../etc/passwd", { dir })).rejects.toThrow(
      /Invalid import id/,
    );
  });
});
