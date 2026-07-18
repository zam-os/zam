import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendLog,
  buildCatalog,
  parseFrontmatter,
  renderIndex,
  validateArticle,
} from "../../src/cli/okf/bundle.js";
import {
  collectSourceLinkBases,
  loadBundle,
  resolveArticlePath,
  resolveBundleDirFromRoots,
  resolveCitationPath,
  upsertArticle,
} from "../../src/cli/okf/io.js";

const article = (over: Partial<Record<string, string>> = {}) =>
  [
    "---",
    `type: ${over.type ?? "concept"}`,
    `title: ${over.title ?? "FSRS Scheduling"}`,
    `description: ${over.description ?? "How ZAM schedules reviews."}`,
    "tags:",
    "  - kernel",
    "  - fsrs",
    'resource: "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md"',
    "timestamp: 2026-07-17T00:00:00Z",
    "---",
    "",
    over.body ?? "FSRS-5 drives the queue.",
    "",
  ].join("\n");

describe("okf/bundle parseFrontmatter", () => {
  it("parses scalars, quoted scalars, and block lists", () => {
    const parsed = parseFrontmatter(article());
    expect(parsed.fields.type).toBe("concept");
    expect(parsed.fields.tags).toEqual(["kernel", "fsrs"]);
    expect(parsed.fields.resource).toBe(
      "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md",
    );
    expect(parsed.body).toContain("FSRS-5 drives the queue.");
  });

  it("rejects a missing opening fence", () => {
    expect(() => parseFrontmatter("type: concept\n---\n")).toThrow(
      /must start with a --- fence/,
    );
  });

  it("rejects an unterminated fence", () => {
    expect(() => parseFrontmatter("---\ntype: concept\n")).toThrow(
      /missing closing/,
    );
  });

  it("rejects list items without a key, with a line number", () => {
    expect(() =>
      parseFrontmatter("---\n  - stray\n---\nbody"),
    ).toThrow(/line 2: list item without a key/);
  });

  it("rejects lines outside the subset", () => {
    expect(() =>
      parseFrontmatter("---\nnested:\n  child: 1\n---\nbody"),
    ).toThrow(/line 3/);
  });
});

describe("okf/bundle validateArticle", () => {
  it("accepts a conforming article", () => {
    expect(validateArticle("fsrs-scheduling.md", article())).toEqual({
      ok: true,
      problems: [],
    });
  });

  it("requires type, description, and a body", () => {
    const md = "---\ntitle: X\n---\n\n";
    const { ok, problems } = validateArticle("x.md", md);
    expect(ok).toBe(false);
    expect(problems.join(" ")).toMatch(/"type" is required/);
    expect(problems.join(" ")).toMatch(/"description" is required/);
    expect(problems.join(" ")).toMatch(/body is empty/);
  });

  it("rejects reserved and non-kebab file names", () => {
    expect(validateArticle("index.md", article()).ok).toBe(false);
    expect(
      validateArticle("Not_Kebab.md", article()).problems.join(" "),
    ).toMatch(/kebab-case/);
  });
});

describe("okf/bundle index and log rendering", () => {
  it("groups the index by type and pins okf_version frontmatter", () => {
    const catalog = buildCatalog([
      { file: "b.md", markdown: article({ type: "protocol", title: "B" }) },
      { file: "a.md", markdown: article({ title: "A" }) },
    ]);
    const index = renderIndex(catalog);
    expect(index.startsWith('---\nokf_version: "0.1"\n---')).toBe(true);
    expect(index).toContain("## concept");
    expect(index).toContain("## protocol");
    expect(index).toContain("- [A](a.md) — How ZAM schedules reviews.");
    expect(index.indexOf("## concept")).toBeLessThan(
      index.indexOf("## protocol"),
    );
  });

  it("appends log entries newest-day-first and merges same-day entries", () => {
    const first = appendLog("", "2026-07-17", "**Creation** — [A](a.md)");
    const sameDay = appendLog(first, "2026-07-17", "**Update** — [A](a.md)");
    const nextDay = appendLog(sameDay, "2026-07-18", "**Creation** — [B](b.md)");
    expect(nextDay.indexOf("## 2026-07-18")).toBeLessThan(
      nextDay.indexOf("## 2026-07-17"),
    );
    const seventeenth = nextDay.slice(nextDay.indexOf("## 2026-07-17"));
    expect(seventeenth.indexOf("**Update**")).toBeLessThan(
      seventeenth.indexOf("**Creation**"),
    );
  });
});

describe("okf/io", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-okf-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses path escapes and reserved targets", () => {
    expect(() => resolveArticlePath(dir, "../evil.md")).toThrow(/invalid/);
    expect(() => resolveArticlePath(dir, "sub/evil.md")).toThrow(/invalid/);
    expect(() => resolveArticlePath(dir, "log.md")).toThrow(/reserved/);
  });

  it("upsert writes the article, regenerates index.md, appends log.md", () => {
    const res = upsertArticle(dir, "fsrs-scheduling.md", article(), "2026-07-17");
    expect(res.validation.ok).toBe(true);
    expect(res.created).toBe(true);
    expect(res.entry?.title).toBe("FSRS Scheduling");
    expect(readFileSync(join(dir, "index.md"), "utf8")).toContain(
      "[FSRS Scheduling](fsrs-scheduling.md)",
    );
    expect(readFileSync(join(dir, "log.md"), "utf8")).toContain(
      "**Creation** — [FSRS Scheduling](fsrs-scheduling.md)",
    );

    const again = upsertArticle(
      dir,
      "fsrs-scheduling.md",
      article({ description: "Updated." }),
      "2026-07-18",
    );
    expect(again.created).toBe(false);
    const log = readFileSync(join(dir, "log.md"), "utf8");
    expect(log.indexOf("## 2026-07-18")).toBeLessThan(
      log.indexOf("## 2026-07-17"),
    );
  });

  it("upsert refuses invalid articles without touching the bundle", () => {
    const res = upsertArticle(dir, "broken.md", "---\ntitle: X\n---\n\n");
    expect(res.validation.ok).toBe(false);
    expect(loadBundle(dir).articles).toEqual([]);
  });

  it("collectSourceLinkBases prefers the resource URL, falls back to the article path", () => {
    upsertArticle(dir, "with-resource.md", article(), "2026-07-17");
    const noResource = [
      "---",
      "type: concept",
      "title: No Resource",
      "description: Article without a resource URL.",
      "tags:",
      "  - kernel",
      "timestamp: 2026-07-17T00:00:00Z",
      "---",
      "",
      "Body.",
      "",
    ].join("\n");
    upsertArticle(dir, "no-resource.md", noResource, "2026-07-17");

    const bases = collectSourceLinkBases(dir);
    expect(bases).toContain(
      "https://github.com/zam-os/zam/blob/main/docs/okf/fsrs-scheduling.md",
    );
    expect(bases).toContain(resolveArticlePath(dir, "no-resource.md"));
    expect(bases).toHaveLength(2);
  });

  it("collectSourceLinkBases throws on a missing bundle directory", () => {
    expect(() => collectSourceLinkBases(join(dir, "nope"))).toThrow(
      /not found/,
    );
  });

  it("loadBundle reports problems but keeps parseable entries in the catalog", () => {
    upsertArticle(dir, "good.md", article({ title: "Good" }), "2026-07-17");
    writeFileSync(join(dir, "bad.md"), "no frontmatter at all\n");
    const bundle = loadBundle(dir);
    expect(bundle.problems.join(" ")).toMatch(/bad\.md/);
    expect(bundle.catalog.map((e) => e.file)).toEqual(["good.md"]);
  });
});

describe("resolveCitationPath", () => {
  const makeRepo = () => {
    const root = mkdtempSync(join(tmpdir(), "zam-okf-cite-"));
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "docs", "okf"), { recursive: true });
    mkdirSync(join(root, "docs", "adr"), { recursive: true });
    writeFileSync(join(root, "docs", "adr", "2026-01-01-x.md"), "# X\n");
    return root;
  };

  it("resolves a relative ADR citation inside the repo", () => {
    const root = makeRepo();
    const p = resolveCitationPath(join(root, "docs", "okf"), "../adr/2026-01-01-x.md");
    expect(p).toBe(resolve(root, "docs", "adr", "2026-01-01-x.md"));
  });

  it("rejects absolute paths", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), resolve(root, "docs/adr/2026-01-01-x.md")))
      .toThrow(/invalid citation target/);
  });

  it("rejects escape from the repo root", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), "../../../etc/passwd.md"))
      .toThrow(/invalid citation target/);
  });

  it("rejects non-markdown targets", () => {
    const root = makeRepo();
    expect(() => resolveCitationPath(join(root, "docs", "okf"), "../adr/x.png"))
      .toThrow(/invalid citation target/);
  });

  it("falls back to the bundle parent as root when no .git exists", () => {
    const root = mkdtempSync(join(tmpdir(), "zam-okf-nogit-"));
    mkdirSync(join(root, "okf"), { recursive: true });
    writeFileSync(join(root, "sibling.md"), "# S\n");
    expect(resolveCitationPath(join(root, "okf"), "../sibling.md")).toBe(resolve(root, "sibling.md"));
    expect(() => resolveCitationPath(join(root, "okf"), "../../outside.md")).toThrow(/invalid citation target/);
  });

  // Hardening (Task 1 review): the containment check must be segment-aware.
  // A bare `rel.startsWith("..")` false-positives on any real path segment
  // that merely starts with the two characters "..", even though it never
  // escapes the repository root.
  it("accepts a directory literally named ..staging inside the repo root", () => {
    const root = makeRepo();
    mkdirSync(join(root, "..staging"), { recursive: true });
    writeFileSync(join(root, "..staging", "note.md"), "# staging\n");
    const p = resolveCitationPath(
      join(root, "docs", "okf"),
      "../../..staging/note.md",
    );
    expect(p).toBe(resolve(root, "..staging", "note.md"));
  });

  // Hardening (Task 1 review): symlink/junction defense. Lexical
  // containment can pass while the path actually redirects outside the
  // repo root via a reparse point; resolveCitationPath must re-check
  // containment against the realpath once the target exists on disk.
  it("rejects a symlink (or, where symlinks are denied, a directory junction) that redirects outside the repo", () => {
    const root = makeRepo();
    const outside = mkdtempSync(join(tmpdir(), "zam-okf-outside-"));
    writeFileSync(join(outside, "secret.md"), "# secret\n");

    let mode: "file-symlink" | "dir-junction" | "skipped" = "skipped";
    try {
      symlinkSync(
        join(outside, "secret.md"),
        join(root, "docs", "adr", "escape-link.md"),
        "file",
      );
      mode = "file-symlink";
    } catch {
      // Windows non-admin denies file symlinks (EPERM) without Developer
      // Mode. Directory junctions are a reparse point too and do not
      // require elevated privilege on Windows, so try that next.
      try {
        symlinkSync(
          outside,
          join(root, "docs", "adr", "escape-junction"),
          "junction",
        );
        mode = "dir-junction";
      } catch {
        mode = "skipped";
      }
    }

    if (mode === "skipped") {
      // eslint-disable-next-line no-console
      console.info(
        "[resolveCitationPath symlink test] OS denied both file symlinks and directory junctions; skipping the live containment assertion.",
      );
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`[resolveCitationPath symlink test] exercised via ${mode}`);

    const target =
      mode === "file-symlink"
        ? "../adr/escape-link.md"
        : "../adr/escape-junction/secret.md";
    expect(() =>
      resolveCitationPath(join(root, "docs", "okf"), target),
    ).toThrow(/invalid citation target/);
  });
});

describe("okf/io resolveBundleDirFromRoots", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-okf-roots-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("picks the first root that contains a docs/okf bundle", () => {
    const withBundle = join(tempDir, "repo-b");
    mkdirSync(join(withBundle, "docs", "okf"), { recursive: true });
    const withoutBundle = join(tempDir, "repo-a");
    mkdirSync(withoutBundle, { recursive: true });

    const dir = resolveBundleDirFromRoots(
      [pathToFileURL(withoutBundle).href, pathToFileURL(withBundle).href],
      "docs/okf",
    );
    expect(dir).toBe(join(withBundle, "docs", "okf"));
  });

  it("prefers the first workspace root over the cwd fallback even without a bundle", () => {
    const workspace = join(tempDir, "workspace");
    mkdirSync(workspace, { recursive: true });
    const dir = resolveBundleDirFromRoots(
      [pathToFileURL(workspace).href],
      "docs/okf",
    );
    // A missing-bundle error should name the workspace, never the server
    // process's application-path cwd (live 0.13.0 finding:
    // "...\Microsoft VS Code\docs\okf").
    expect(dir).toBe(join(workspace, "docs", "okf"));
  });

  it("falls back to the cwd default with no usable roots", () => {
    expect(resolveBundleDirFromRoots([], "docs/okf")).toBe("docs/okf");
    expect(
      resolveBundleDirFromRoots(["https://not-a-file.example"], "docs/okf"),
    ).toBe("docs/okf");
  });
});
