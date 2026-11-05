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
  toCatalogEntry,
  updateIndex,
  validateArticle,
} from "../../src/cli/okf/bundle.js";
import {
  collectSourceLinkBases,
  isZamBundle,
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
    over.body ?? "FSRS-6 drives the queue.",
    "",
  ].join("\n");

const logEntry = (file = "a.md", created = false) => ({
  file,
  title: file.slice(0, -3).toUpperCase(),
  created,
});

const curatedIndex = [
  "---",
  'okf_version: "0.1"',
  'title: "Our handbook"',
  "---",
  "",
  "# Our handbook",
  "",
  "Start here. Articles are written with `zam_okf_upsert`.",
  "",
  "## concept",
  "",
  "### Scheduling",
  "",
  "- [FSRS](fsrs-scheduling.md) — Curated wording for this article.",
  "- [Other](other.md) — Keep this wording, not its frontmatter description.",
  "",
  "## protocol",
  "",
  "A curated introduction to protocols.",
  "",
  "- [Bridge](bridge.md) — A hand-written overview.",
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
    expect(parsed.body).toContain("FSRS-6 drives the queue.");
  });

  it("parses CRLF line endings (Windows checkouts with autocrlf)", () => {
    const parsed = parseFrontmatter(article().replace(/\n/g, "\r\n"));
    expect(parsed.fields.type).toBe("concept");
    expect(parsed.fields.tags).toEqual(["kernel", "fsrs"]);
    expect(parsed.body).toContain("FSRS-6 drives the queue.");
    expect(parsed.body).not.toContain("\r");
  });

  it("validates a CRLF article as conformant", () => {
    const result = validateArticle(
      "fsrs-scheduling.md",
      article().replace(/\n/g, "\r\n"),
    );
    expect(result.ok).toBe(true);
    expect(result.problems).toEqual([]);
  });

  it("strips a leading UTF-8 BOM (Windows editors) before the fence check", () => {
    const parsed = parseFrontmatter(`﻿${article().replace(/\n/g, "\r\n")}`);
    expect(parsed.fields.type).toBe("concept");
    expect(parsed.body).toContain("FSRS-6 drives the queue.");
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
    expect(() => parseFrontmatter("---\n  - stray\n---\nbody")).toThrow(
      /line 2: list item without a key/,
    );
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
    const first = appendLog("", "2026-07-17", logEntry("a.md", true));
    const sameDay = appendLog(first, "2026-07-17", logEntry());
    const nextDay = appendLog(sameDay, "2026-07-18", logEntry("b.md", true));
    expect(nextDay.indexOf("## 2026-07-18")).toBeLessThan(
      nextDay.indexOf("## 2026-07-17"),
    );
    const seventeenth = nextDay.slice(nextDay.indexOf("## 2026-07-17"));
    expect(seventeenth.indexOf("**Update**")).toBeLessThan(
      seventeenth.indexOf("**Creation**"),
    );
  });

  it("records a repeated same-day update once, but again on a later day", () => {
    // Revising an article several times in one sitting must not bury the
    // other articles touched that day under identical lines.
    const line = "**Update** — [A](a.md)";
    let log = appendLog("", "2026-08-01", logEntry());
    log = appendLog(log, "2026-08-01", logEntry());
    log = appendLog(log, "2026-08-01", logEntry());
    expect(log.split(line).length - 1).toBe(1);

    log = appendLog(log, "2026-08-01", logEntry("b.md"));
    log = appendLog(log, "2026-08-02", logEntry());
    expect(log.split(line).length - 1).toBe(2);
    const secondDay = log.slice(
      log.indexOf("## 2026-08-02"),
      log.indexOf("## 2026-08-01"),
    );
    expect(secondDay).toContain(line);
  });

  it("merges into a CRLF log without changing its existing bytes", () => {
    const crlfLog = "# Log\r\n\r\n## 2026-07-18\r\n\r\n- old entry\r\n";
    const next = appendLog(crlfLog, "2026-07-18", logEntry());
    expect(next).toBe(
      crlfLog.replace("- old entry", "- **Update** — [A](a.md)\r\n- old entry"),
    );
  });

  it("preserves dated filename bullets, notes, intro, and same-day deduplication", () => {
    const log =
      "# Changes\n\nOur own history.\n\n- 2026-07-17 — old.md: created (reviewed by hand)\n";
    const first = appendLog(log, "2026-07-18", logEntry("a.md", true));
    expect(first).toBe(
      log.replace("- 2026-07-17", "- 2026-07-18 — a.md: created\n- 2026-07-17"),
    );
    const updated = appendLog(first, "2026-07-18", logEntry());
    expect(updated).toContain(
      "- 2026-07-18 — a.md: updated\n- 2026-07-18 — a.md: created",
    );
    expect(appendLog(updated, "2026-07-18", logEntry())).toBe(updated);
    const nextDay = appendLog(updated, "2026-07-19", logEntry());
    expect(nextDay).toContain("- 2026-07-19 — a.md: updated");
    expect(nextDay).not.toContain("## ");
    expect(nextDay).not.toContain("**Update**");
  });

  it("retains a dated bullet's marker, separator, code quotes, and CRLF", () => {
    const log = "# Changes\r\n\r\n* 2026-07-17 - `old.md`: created (keep)\r\n";
    const next = appendLog(log, "2026-07-18", logEntry());
    expect(next).toBe(
      log.replace(
        "* 2026-07-17",
        "* 2026-07-18 - `a.md`: updated\r\n* 2026-07-17",
      ),
    );
    expect(
      appendLog(
        next.replace("updated", "updated (note)"),
        "2026-07-18",
        logEntry(),
      ),
    ).toBe(next.replace("updated", "updated (note)"));
  });

  it("keeps ascending dated-bullet history and its footer", () => {
    const log =
      "# Changes\n\n- 2026-07-16 — old.md: created\n- 2026-07-17 — other.md: updated\n\nKeep this footer.\n";
    expect(appendLog(log, "2026-07-18", logEntry())).toBe(
      log.replace("\n\nKeep", "\n- 2026-07-18 — a.md: updated\n\nKeep"),
    );
  });

  it("keeps date-heading history order and deduplicates non-top date groups", () => {
    const log =
      "# History\n\nIntro.\n\n## 2026-07-16\n\n- **Update** — [A](a.md)\n\n## 2026-07-17\n\n- **Creation** — [B](b.md)\n";
    expect(appendLog(log, "2026-07-16", logEntry())).toBe(log);
    expect(appendLog(log, "2026-07-18", logEntry())).toBe(
      `${log}\n## 2026-07-18\n\n- **Update** — [A](a.md)\n\n`,
    );
  });

  it("adds a dated bullet to a nonempty log with no date headings", () => {
    const log = "# Changelog\n\nHistory begins here.";
    expect(appendLog(log, "2026-07-18", logEntry())).toBe(
      `${log}\n\n- 2026-07-18 — a.md: updated\n`,
    );
  });

  it("ignores log-format examples in fenced code", () => {
    const log =
      "# History\n\n```md\n## 2000-01-01\n```\n\n- 2026-07-17 — old.md: created\n";
    expect(appendLog(log, "2026-07-18", logEntry())).toBe(
      log.replace("- 2026-07-17", "- 2026-07-18 — a.md: updated\n- 2026-07-17"),
    );
  });
});

describe("okf/bundle incremental index maintenance", () => {
  it.each(["\n", "\r\n"])(
    "changes only the target row in a curated index (%j)",
    (eol) => {
      const index = curatedIndex.replace(/\n/g, eol);
      const entry = toCatalogEntry(
        "fsrs-scheduling.md",
        article({ description: "Updated." }),
      );
      const next = updateIndex(index, entry);
      expect(next).toBe(
        index.replace(
          "- [FSRS](fsrs-scheduling.md) — Curated wording for this article.",
          "- [FSRS Scheduling](fsrs-scheduling.md) — Updated.",
        ),
      );
      expect(updateIndex(next, entry)).toBe(next);
    },
  );

  it("inserts a new article in its type before existing subgroups", () => {
    const entry = toCatalogEntry("new.md", article({ title: "New" }));
    expect(updateIndex(curatedIndex, entry)).toBe(
      curatedIndex.replace(
        "## concept\n",
        "## concept\n\n- [New](new.md) — How ZAM schedules reviews.\n",
      ),
    );
  });

  it("moves only the article's row when its type changes", () => {
    const entry = toCatalogEntry(
      "fsrs-scheduling.md",
      article({ type: "protocol" }),
    );
    expect(updateIndex(curatedIndex, entry)).toBe(
      curatedIndex
        .replace(
          "- [FSRS](fsrs-scheduling.md) — Curated wording for this article.\n",
          "",
        )
        .replace(
          "- [Bridge](bridge.md) — A hand-written overview.\n",
          "- [Bridge](bridge.md) — A hand-written overview.\n- [FSRS Scheduling](fsrs-scheduling.md) — How ZAM schedules reviews.\n",
        ),
    );
  });

  it("adds a missing type section without replacing an index that has no final newline", () => {
    const entry = toCatalogEntry(
      "new.md",
      article({ type: "algorithm", title: "New" }),
    );
    const index = curatedIndex.trimEnd();
    expect(updateIndex(index, entry)).toBe(
      `${index}\n\n## algorithm\n\n- [New](new.md) — How ZAM schedules reviews.\n`,
    );
  });

  it("preserves list markers and handles ./ links without duplicating the entry", () => {
    const index = "# Custom\n\n## concept ##\n\n* [Old](./a.md) — Old.";
    expect(
      updateIndex(index, toCatalogEntry("a.md", article({ title: "A" }))),
    ).toBe(
      "# Custom\n\n## concept ##\n\n* [A](a.md) — How ZAM schedules reviews.",
    );
  });

  it.each(["Arrays [T]", "Arrays [Map[K, V]]"])(
    "updates renderer-generated nested labels without duplicates: %s",
    (title) => {
      const entry = toCatalogEntry("arrays.md", article({ title }));
      const index = renderIndex([entry]);
      const revised = { ...entry, description: "Updated." };
      const next = updateIndex(index, revised);
      expect(next).toBe(index.replace(entry.description, revised.description));
      expect(updateIndex(next, revised)).toBe(next);
      expect(next.split("](arrays.md)").length - 1).toBe(1);
    },
  );

  it.each([
    '- [Arrays [T]](./arrays.md "Reference") — Old.',
    "- [Arrays \\[T\\]](<./arrays.md> 'Reference') — Old.",
    "- [Arrays [T]](arrays.md (Reference)) — Old.",
  ])("recognizes escaped labels and optional link titles: %s", (oldRow) => {
    const entry = toCatalogEntry("arrays.md", article({ title: "Arrays [T]" }));
    const index = `# Handbook\n\n## concept\n\n${oldRow}\n`;
    const next = updateIndex(index, entry);
    expect(next).toBe(
      index.replace(
        oldRow,
        "- [Arrays [T]](arrays.md) — How ZAM schedules reviews.",
      ),
    );
    expect(updateIndex(next, entry)).toBe(next);
  });

  it("does not mistake a secondary link in another article's row for its entry", () => {
    const other = "- [Other](other.md) — See [Arrays [T]](arrays.md).";
    const index = `# Handbook\n\n## concept\n\n${other}\n- [Old](arrays.md) — Old.\n`;
    const entry = toCatalogEntry("arrays.md", article({ title: "Arrays [T]" }));
    expect(updateIndex(index, entry)).toBe(
      index.replace(
        "- [Old](arrays.md) — Old.",
        "- [Arrays [T]](arrays.md) — How ZAM schedules reviews.",
      ),
    );
  });

  it.each(["    ", "\t", " \t", "   \t"])(
    "leaves an indented code example unchanged before the real row (%j)",
    (indent) => {
      const example = `${indent}- [A](a.md) — An example.`;
      const index = `# Handbook\n\n## concept\n\nExample:\n\n${example}\n\n- [A](a.md) — Real entry.\n`;
      const entry = toCatalogEntry(
        "a.md",
        article({ title: "A", description: "Updated." }),
      );
      const next = updateIndex(index, entry);
      expect(next).toBe(
        index.replace("- [A](a.md) — Real entry.", "- [A](a.md) — Updated."),
      );
      expect(updateIndex(next, entry)).toBe(next);
    },
  );

  it("moves the real row on a type change without removing an indented example", () => {
    const index =
      "# Handbook\n\n## concept\n\nExample:\n\n    - [A](a.md) — An example.\n\n- [A](a.md) — Real entry.\n\n## protocol\n\n- [B](b.md) — Keep.\n";
    const entry = toCatalogEntry(
      "a.md",
      article({ title: "A", type: "protocol", description: "Updated." }),
    );
    expect(updateIndex(index, entry)).toBe(
      index
        .replace("- [A](a.md) — Real entry.\n", "")
        .replace(
          "- [B](b.md) — Keep.\n",
          "- [B](b.md) — Keep.\n- [A](a.md) — Updated.\n",
        ),
    );
  });

  it("keeps valid three-space-indented list rows editable", () => {
    const index = "# Handbook\n\n## concept\n\n   * [A](a.md) — Old.\n";
    const entry = toCatalogEntry(
      "a.md",
      article({ title: "A", description: "Updated." }),
    );
    expect(updateIndex(index, entry)).toBe(
      index.replace("— Old.", "— Updated."),
    );
  });

  it("leaves frontmatter, prose links and fenced examples alone", () => {
    const index =
      "---\ntitle: Example\n---\n\n# Handbook\n\nSee [A](a.md).\n\n```md\n## concept\n- [A](a.md) — Example only.\n```\n\n## concept\n\n- [Actual](a.md) — Old.\n";
    expect(
      updateIndex(index, toCatalogEntry("a.md", article({ title: "A" }))),
    ).toBe(
      index.replace(
        "- [Actual](a.md) — Old.",
        "- [A](a.md) — How ZAM schedules reviews.",
      ),
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

  it("upsert writes the article and initializes missing navigation files", () => {
    const res = upsertArticle(
      dir,
      "fsrs-scheduling.md",
      article(),
      "2026-07-17",
    );
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

  it("upsert preserves a curated bundle's index and dated-bullet log (#474)", () => {
    writeFileSync(join(dir, "index.md"), curatedIndex);
    writeFileSync(join(dir, "fsrs-scheduling.md"), article());
    writeFileSync(
      join(dir, "other.md"),
      article({ description: "Different from the index." }),
    );
    const log =
      "# Our history\n\n- 2026-07-16 — fsrs-scheduling.md: created (initial review)\n";
    writeFileSync(join(dir, "log.md"), log);

    expect(
      upsertArticle(
        dir,
        "fsrs-scheduling.md",
        article({ description: "Updated." }),
        "2026-07-18",
      ).validation.ok,
    ).toBe(true);
    expect(readFileSync(join(dir, "index.md"), "utf8")).toBe(
      curatedIndex.replace(
        "- [FSRS](fsrs-scheduling.md) — Curated wording for this article.",
        "- [FSRS Scheduling](fsrs-scheduling.md) — Updated.",
      ),
    );
    expect(readFileSync(join(dir, "log.md"), "utf8")).toBe(
      log.replace(
        "- 2026-07-16",
        "- 2026-07-18 — fsrs-scheduling.md: updated\n- 2026-07-16",
      ),
    );
    expect(isZamBundle(dir)).toBe(true);
    expect(loadBundle(dir).problems).toEqual([]);
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
    const p = resolveCitationPath(
      join(root, "docs", "okf"),
      "../adr/2026-01-01-x.md",
    );
    expect(p).toBe(resolve(root, "docs", "adr", "2026-01-01-x.md"));
  });

  it("rejects absolute paths", () => {
    const root = makeRepo();
    expect(() =>
      resolveCitationPath(
        join(root, "docs", "okf"),
        resolve(root, "docs/adr/2026-01-01-x.md"),
      ),
    ).toThrow(/invalid citation target/);
  });

  it("rejects escape from the repo root", () => {
    const root = makeRepo();
    expect(() =>
      resolveCitationPath(join(root, "docs", "okf"), "../../../etc/passwd.md"),
    ).toThrow(/invalid citation target/);
  });

  it("rejects non-markdown targets", () => {
    const root = makeRepo();
    expect(() =>
      resolveCitationPath(join(root, "docs", "okf"), "../adr/x.png"),
    ).toThrow(/invalid citation target/);
  });

  it("falls back to the bundle parent as root when no .git exists", () => {
    const root = mkdtempSync(join(tmpdir(), "zam-okf-nogit-"));
    mkdirSync(join(root, "okf"), { recursive: true });
    writeFileSync(join(root, "sibling.md"), "# S\n");
    expect(resolveCitationPath(join(root, "okf"), "../sibling.md")).toBe(
      resolve(root, "sibling.md"),
    );
    expect(() =>
      resolveCitationPath(join(root, "okf"), "../../outside.md"),
    ).toThrow(/invalid citation target/);
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
