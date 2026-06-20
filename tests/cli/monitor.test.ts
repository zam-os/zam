import { describe, expect, it } from "vitest";
import { selectWindowsExecutable } from "../../src/cli/commands/monitor.js";

describe("selectWindowsExecutable", () => {
  const pathext = ".COM;.EXE;.BAT;.CMD";

  it("prefers the PATHEXT match over an extensionless npm shim (#51)", () => {
    // `where.exe zam` lists the Unix shell shim first, then the .cmd wrapper.
    // PowerShell can only run the .cmd, so the extensionless shim must lose.
    const results = [
      "C:\\Users\\me\\AppData\\Roaming\\npm\\zam",
      "C:\\Users\\me\\AppData\\Roaming\\npm\\zam.cmd",
    ];
    expect(selectWindowsExecutable(results, pathext)).toBe(
      "C:\\Users\\me\\AppData\\Roaming\\npm\\zam.cmd",
    );
  });

  it("returns a .exe match directly", () => {
    const results = ["C:\\Program Files\\PowerShell\\7\\pwsh.exe"];
    expect(selectWindowsExecutable(results, pathext)).toBe(
      "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
    );
  });

  it("matches PATHEXT case-insensitively", () => {
    const results = ["C:\\tools\\foo.CMD"];
    expect(selectWindowsExecutable(results, pathext)).toBe("C:\\tools\\foo.CMD");
  });

  it("falls back to the first result when none match PATHEXT", () => {
    const results = ["C:\\weird\\zam", "C:\\weird\\zam.bak"];
    expect(selectWindowsExecutable(results, pathext)).toBe("C:\\weird\\zam");
  });

  it("returns null for an empty list", () => {
    expect(selectWindowsExecutable([], pathext)).toBeNull();
  });
});
