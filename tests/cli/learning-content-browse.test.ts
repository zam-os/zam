import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  catalogSource,
  readSourceFile,
} from "../../src/cli/learning-content/browse.js";
import { isSkillSource } from "../../src/cli/provisioning/index.js";

const ARTICLE = `---
type: Reference
title: Bridges
description: How the bridge speaks JSON.
---

The bridge speaks JSON.

See [the decision](../adr/note.md).
`;

describe("learning content browse", () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs.splice(0))
      rmSync(dir, { recursive: true, force: true });
  });

  function repo(): string {
    const dir = mkdtempSync(join(tmpdir(), "zam-browse-"));
    dirs.push(dir);
    return dir;
  }

  it("names a missing bundle in one result and reads an article or a cited file", () => {
    const root = repo();
    expect(catalogSource(root).okf).toEqual({ found: false });
    expect(catalogSource(root).skillSource).toBe(false);

    mkdirSync(join(root, "docs", "okf"), { recursive: true });
    mkdirSync(join(root, "docs", "adr"), { recursive: true });
    writeFileSync(join(root, "docs", "okf", "bridges.md"), ARTICLE);
    writeFileSync(join(root, "docs", "adr", "note.md"), "A decision.");
    writeFileSync(join(root, "README.md"), "Read me.");

    const catalog = catalogSource(root);
    expect(catalog.okf).toEqual({
      found: true,
      articles: [{ file: "bridges.md", title: "Bridges" }],
    });

    const article = readSourceFile(root, "bridges.md");
    expect(article.opened).toBe(true);
    expect(article.kind).toBe("okf");
    expect(article.body).toContain("The bridge speaks JSON.");

    const cited = readSourceFile(root, "../adr/note.md");
    expect(cited).toMatchObject({
      opened: true,
      kind: "text",
      path: "docs/adr/note.md",
      body: "A decision.",
    });
    expect(readSourceFile(root, "README.md").kind).toBe("text");
  });

  it("does not open a path outside the root, including through a symlink", () => {
    const root = repo();
    writeFileSync(join(root, "inside.txt"), "inside");
    const secret = join(tmpdir(), `zam-browse-secret-${Date.now()}`);
    writeFileSync(secret, "secret");
    dirs.push(secret);
    symlinkSync(secret, join(root, "leak.txt"));

    expect(readSourceFile(root, "../../../../../../../etc/passwd")).toEqual({
      opened: false,
      reason: "outside",
    });
    expect(readSourceFile(root, "/etc/passwd")).toEqual({
      opened: false,
      reason: "outside",
    });
    expect(readSourceFile(root, "https://example.com/secret")).toEqual({
      opened: false,
      reason: "outside",
    });
    expect(readSourceFile(root, "leak.txt").opened).toBe(false);
    expect(readSourceFile(root, "leak.txt").body).toBeUndefined();
    expect(readSourceFile(root, "missing.txt").reason).toBe("missing");
  });

  it("treats a bundle directory that links outside the root as missing", () => {
    const root = repo();
    const elsewhere = repo();
    mkdirSync(join(root, "docs"), { recursive: true });
    mkdirSync(join(elsewhere, "okf"), { recursive: true });
    writeFileSync(join(elsewhere, "okf", "outside.md"), ARTICLE);
    symlinkSync(join(elsewhere, "okf"), join(root, "docs", "okf"));
    expect(catalogSource(root).okf.found).toBe(false);
  });

  it("recognises the package root as the skill source and a clone as ordinary", () => {
    const root = repo();
    expect(isSkillSource(process.cwd())).toBe(true);
    expect(isSkillSource(root)).toBe(false);
    expect(isSkillSource(join(root, "missing"))).toBe(false);
    const linked = join(root, "checkout");
    symlinkSync(process.cwd(), linked);
    expect(isSkillSource(linked)).toBe(true);
  });
});
