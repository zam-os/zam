/**
 * Tests for observation/shell-hooks.ts — generated shell monitor snippets.
 */

import { describe, expect, it } from "vitest";
import {
  generatePowerShellHooks,
  generatePowerShellUnhooks,
} from "../../../src/kernel/observation/shell-hooks.js";

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
