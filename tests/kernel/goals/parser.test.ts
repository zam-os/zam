import { describe, it, expect } from "vitest";
import {
  parseGoalFile,
  serializeGoal,
  extractTasks,
  extractTokenRefs,
} from "../../../src/kernel/goals/parser.js";

describe("parseGoalFile", () => {
  it("parses a complete goal file with frontmatter", () => {
    const content = `---
title: Learn Rust fundamentals
status: active
parent: become-systems-programmer
created: 2026-03-01
updated: 2026-03-15
---

## Description
Learn the core Rust language features.

## Tasks
- [ ] Complete Rustlings exercises
- [x] Read the Rust Book

## Tokens
- rust/ownership
- rust/borrowing`;

    const goal = parseGoalFile(content, "learn-rust", "/tmp/learn-rust.md");

    expect(goal.slug).toBe("learn-rust");
    expect(goal.title).toBe("Learn Rust fundamentals");
    expect(goal.status).toBe("active");
    expect(goal.parent).toBe("become-systems-programmer");
    expect(goal.created).toBe("2026-03-01");
    expect(goal.updated).toBe("2026-03-15");
    expect(goal.filePath).toBe("/tmp/learn-rust.md");
    expect(goal.body).toContain("## Description");
  });

  it("defaults to slug as title when title is missing", () => {
    const content = `---
status: paused
---

Some body.`;

    const goal = parseGoalFile(content, "my-goal", "/tmp/my-goal.md");
    expect(goal.title).toBe("my-goal");
    expect(goal.status).toBe("paused");
    expect(goal.parent).toBeNull();
  });

  it("defaults to active status for invalid status values", () => {
    const content = `---
title: Test
status: invalid
---`;

    const goal = parseGoalFile(content, "test", "/tmp/test.md");
    expect(goal.status).toBe("active");
  });

  it("handles files with no frontmatter", () => {
    const content = "Just a body with no frontmatter.";
    const goal = parseGoalFile(content, "plain", "/tmp/plain.md");

    expect(goal.title).toBe("plain");
    expect(goal.status).toBe("active");
    expect(goal.body).toBe("Just a body with no frontmatter.");
  });
});

describe("serializeGoal", () => {
  it("round-trips through parse and serialize", () => {
    const original = `---
title: Learn Rust fundamentals
status: active
parent: become-systems-programmer
created: 2026-03-01
updated: 2026-03-15
---

## Description
Learn the core Rust language features.`;

    const goal = parseGoalFile(original, "learn-rust", "/tmp/learn-rust.md");
    const serialized = serializeGoal(goal);

    expect(serialized).toContain("title: Learn Rust fundamentals");
    expect(serialized).toContain("status: active");
    expect(serialized).toContain("parent: become-systems-programmer");
    expect(serialized).toContain("## Description");
  });

  it("omits parent when null", () => {
    const content = `---
title: Solo goal
status: active
created: 2026-03-01
updated: 2026-03-01
---`;

    const goal = parseGoalFile(content, "solo", "/tmp/solo.md");
    const serialized = serializeGoal(goal);

    expect(serialized).not.toContain("parent:");
  });
});

describe("extractTasks", () => {
  it("extracts checked and unchecked tasks", () => {
    const body = `## Tasks
- [ ] Complete Rustlings exercises
- [x] Read the Rust Book
- [X] Install Rust toolchain
- [ ] Build a CLI tool`;

    const tasks = extractTasks(body);
    expect(tasks).toHaveLength(4);
    expect(tasks[0]).toEqual({ text: "Complete Rustlings exercises", done: false });
    expect(tasks[1]).toEqual({ text: "Read the Rust Book", done: true });
    expect(tasks[2]).toEqual({ text: "Install Rust toolchain", done: true });
    expect(tasks[3]).toEqual({ text: "Build a CLI tool", done: false });
  });

  it("returns empty array when no tasks", () => {
    expect(extractTasks("No tasks here.")).toEqual([]);
  });
});

describe("extractTokenRefs", () => {
  it("extracts token references from Tokens section", () => {
    const body = `## Description
Some text.

## Tokens
- rust/ownership
- rust/borrowing
- git/branching`;

    const refs = extractTokenRefs(body);
    expect(refs).toEqual(["rust/ownership", "rust/borrowing", "git/branching"]);
  });

  it("returns empty array when no Tokens section", () => {
    expect(extractTokenRefs("Just text.")).toEqual([]);
  });
});
