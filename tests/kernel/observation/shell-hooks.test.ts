/**
 * Tests for observation/shell-hooks.ts — generated shell monitor snippets.
 */

import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateBashHooks,
  generatePowerShellHooks,
  generatePowerShellUnhooks,
  generateZshHooks,
} from "../../../src/kernel/observation/shell-hooks.js";

/** POSIX shells only: on Windows `bash` may be WSL or Git Bash with other paths. */
function hasShell(shell: string): boolean {
  if (process.platform === "win32") return false;
  return spawnSync(shell, ["-c", "true"], { stdio: "ignore" }).status === 0;
}

describe("PowerShell monitor hooks", () => {
  it("generates PowerShell hook code for the existing monitor event schema", () => {
    const script = generatePowerShellHooks(
      "C:\\Users\\Thomas\\.zam\\monitor\\session.jsonl",
      "session-1",
    );

    expect(script).toContain(
      "$global:__ZAM_MONITOR_FILE = 'C:\\Users\\Thomas\\.zam\\monitor\\session.jsonl'",
    );
    expect(script).toContain("$global:__ZAM_MONITOR_SESSION = 'session-1'");
    expect(script).toContain("ConvertTo-Json -Compress -Depth 4");
    expect(script).toContain('type = "command_start"');
    expect(script).toContain('type = "command_end"');
    expect(script).toContain("exit_code = $exitCode");
    expect(script).toContain("function global:prompt");
  });

  it("escapes single quotes in PowerShell string literals", () => {
    const script = generatePowerShellHooks(
      "C:\\tmp\\zam's\\session.jsonl",
      "session'2",
    );

    expect(script).toContain(
      "$global:__ZAM_MONITOR_FILE = 'C:\\tmp\\zam''s\\session.jsonl'",
    );
    expect(script).toContain("$global:__ZAM_MONITOR_SESSION = 'session''2'");
  });

  it("generates PowerShell unhook code that restores the previous prompt", () => {
    const script = generatePowerShellUnhooks();

    expect(script).toContain("function:\\__zam_previous_prompt");
    expect(script).toContain("Set-Item -Path function:\\prompt");
    expect(script).toContain("Remove-Variable -Name __ZAM_MONITOR_FILE");
    expect(script).toContain('Write-Host "ZAM monitor stopped."');
  });
});

/**
 * The hooks run in a real shell: `zam monitor start` creates the log first,
 * the hooks append while it exists, and once session end deletes it a
 * terminal left open records nothing (ADR 2026-10-08 R6).
 */
describe("zsh and bash monitor hooks", () => {
  let dir: string;
  let log: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-hooks-"));
    log = join(dir, "session.jsonl");
    writeFileSync(log, '{"type":"monitor_meta","event":"start"}\n');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /**
   * zsh calls preexec even in a script, with an empty command line, so the
   * zsh cases detach the automatic hooks and call the functions themselves.
   */
  const ZSH_MANUAL = "\npreexec_functions=()\nprecmd_functions=()\n";

  function run(shell: string, hooks: string, body: string): string {
    const script = join(dir, "run.sh");
    writeFileSync(join(dir, "hooks.sh"), hooks);
    writeFileSync(script, `source "${join(dir, "hooks.sh")}" >/dev/null\n${body}\n`);
    return execFileSync(shell, [script], { cwd: dir, encoding: "utf8" });
  }

  it.skipIf(!hasShell("zsh"))(
    "zsh records without a working directory and stops once the log is gone",
    () => {
      const out = run(
        "zsh",
        generateZshHooks(log, "s1") + ZSH_MANUAL,
        [
          "__zam_preexec 'npm run build'",
          "__zam_precmd",
          `rm "${log}"`,
          "__zam_preexec 'cat secrets.txt'",
          "__zam_precmd",
          `[[ -e "${log}" ]] && echo recreated || echo gone`,
        ].join("\n"),
      );
      expect(out.trim()).toBe("gone");
    },
  );

  it.skipIf(!hasShell("zsh"))("zsh writes the start and end of a command", () => {
    run(
      "zsh",
      generateZshHooks(log, "s1") + ZSH_MANUAL,
      ["__zam_preexec 'npm run build'", "__zam_precmd"].join("\n"),
    );
    const events = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.map((e) => e.type)).toEqual([
      "monitor_meta",
      "command_start",
      "command_end",
    ]);
    expect(events[1].command).toBe("npm run build");
    expect(events[1]).not.toHaveProperty("cwd");
  });

  it.skipIf(!hasShell("bash"))(
    "bash records without a working directory and stops once the log is gone",
    () => {
      const out = run(
        "bash",
        generateBashHooks(log, "s1"),
        [
          // Installing the hooks records one line of their own; close it.
          "__zam_prompt_cmd",
          // The DEBUG trap records this command; the prompt hook ends it.
          "true npm run build",
          "__zam_prompt_cmd",
          `rm "${log}"`,
          "__zam_prompt_cmd",
          "true cat secrets.txt",
          "__zam_prompt_cmd",
          `[[ -e "${log}" ]] && echo recreated || echo gone`,
        ].join("\n"),
      );
      expect(out.trim()).toBe("gone");
    },
  );

  it.skipIf(!hasShell("bash"))("bash writes the start and end of a command", () => {
    run(
      "bash",
      generateBashHooks(log, "s1"),
      ["__zam_prompt_cmd", "true npm run build", "__zam_prompt_cmd"].join("\n"),
    );
    const events = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.slice(-2).map((e) => e.type)).toEqual([
      "command_start",
      "command_end",
    ]);
    expect(events.at(-2).command).toBe("true npm run build");
    for (const event of events) expect(event).not.toHaveProperty("cwd");
  });

  /** Commands that broke the old escaping, with what a reader must get back. */
  const TRICKY: Array<[string, string]> = [
    ['grep "a\\|b" file', 'grep "a\\|b" file'],
    ["echo one \\\ntwo", "echo one \\\ntwo"],
    ['printf "x\ty"', 'printf "x\ty"'],
    ["printf 'a\rb'", "printf 'a\rb'"],
    ["type C:\\Users\\name\\notes.txt", "type C:\\Users\\name\\notes.txt"],
    ["echo trailing\\", "echo trailing\\"],
    ["printf '\u001b[31mred'", "printf '[31mred'"],
    ["echo über – 日本 🙂 & $HOME * ? [x]", "echo über – 日本 🙂 & $HOME * ? [x]"],
  ];

  function writeTricky(): void {
    TRICKY.forEach(([command], index) => {
      writeFileSync(join(dir, `cmd${index}.txt`), command);
    });
  }

  it.skipIf(!hasShell("zsh"))(
    "zsh writes valid JSON for backslashes, quotes and line breaks",
    () => {
      writeTricky();
      run(
        "zsh",
        generateZshHooks(log, "s1") + ZSH_MANUAL,
        'for f in cmd*.txt(n); do __zam_preexec "$(<$f)"; __zam_precmd; done',
      );
      const starts = readFileSync(log, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line))
        .filter((event) => event.type === "command_start");
      expect(starts.map((event) => event.command)).toEqual(
        TRICKY.map(([, expected]) => expected),
      );
    },
  );

  it.skipIf(!hasShell("bash"))(
    "bash writes valid JSON for backslashes, quotes and line breaks",
    () => {
      writeTricky();
      const out = run(
        "bash",
        generateBashHooks(log, "s1"),
        [
          "trap - DEBUG",
          'for f in cmd*.txt; do __zam_json_escape "$(cat "$f")"; printf \'{"command":"%s"}\\n\' "$__ZAM_ESCAPED"; done',
        ].join("\n"),
      );
      const commands = out
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line).command);
      expect(commands).toEqual(TRICKY.map(([, expected]) => expected));
    },
  );

  it.skipIf(!hasShell("bash"))("bash records a quoted command through its trap", () => {
    run(
      "bash",
      generateBashHooks(log, "s1"),
      ["__zam_prompt_cmd", `true 'a\\b' "say \\"hi\\""`, "__zam_prompt_cmd"].join(
        "\n",
      ),
    );
    const events = readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(events.at(-2).command).toBe(`true 'a\\b' "say \\"hi\\""`);
  });

  it("PowerShell writes only while the log exists and never the directory", () => {
    const script = generatePowerShellHooks("C:\\zam\\s.jsonl", "s1");
    expect(script).toContain(
      "if (-not [System.IO.File]::Exists($global:__ZAM_MONITOR_FILE)) { return }",
    );
    expect(script).not.toMatch(/cwd/i);
    expect(existsSync(log)).toBe(true);
  });
});
