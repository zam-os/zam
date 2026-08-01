import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loginBitwardenForProcess,
  unlockBitwardenForProcess,
} from "../../src/cli/secrets-bridge.js";

/**
 * A master password must never reach another process's argv.
 *
 * `ps` shows the full command line of any process running as the same user,
 * and on Linux `/proc/<pid>/cmdline` is world-readable — so `bw login <email>
 * <password>` hands the learner's Bitwarden master password to anything else
 * running on the machine for the duration of the call. Bitwarden's CLI offers
 * `--passwordenv` exactly for this; both login and unlock must use it.
 *
 * The test replaces `bw` on PATH with a recorder that writes down the argv it
 * was called with and whether the password arrived through the environment.
 */
describe.skipIf(process.platform === "win32")(
  "Bitwarden master password handling",
  () => {
    const PASSWORD = "correct-horse-battery-staple";
    let dir: string;
    let argvLog: string;
    let envLog: string;
    let originalPath: string | undefined;
    let originalSession: string | undefined;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), "zam-bw-argv-"));
      argvLog = join(dir, "argv.txt");
      envLog = join(dir, "env.txt");

      const fakeBw = join(dir, "bw");
      writeFileSync(
        fakeBw,
        [
          "#!/bin/sh",
          `printf '%s\\n' "$@" > ${JSON.stringify(argvLog)}`,
          `printf '%s' "\${BW_PASSWORD}" > ${JSON.stringify(envLog)}`,
          "echo fake-session-key",
        ].join("\n"),
        "utf8",
      );
      chmodSync(fakeBw, 0o755);

      originalPath = process.env.PATH;
      originalSession = process.env.BW_SESSION;
      process.env.PATH = `${dir}:${originalPath ?? ""}`;
      process.env.ZAM_BW_SESSION_PATH = join(dir, "session.json");
      delete process.env.BW_SESSION;
    });

    afterEach(() => {
      if (originalPath === undefined) delete process.env.PATH;
      else process.env.PATH = originalPath;
      if (originalSession === undefined) delete process.env.BW_SESSION;
      else process.env.BW_SESSION = originalSession;
      delete process.env.ZAM_BW_SESSION_PATH;
      rmSync(dir, { recursive: true, force: true });
    });

    const recordedArgv = (): string[] =>
      readFileSync(argvLog, "utf8").split("\n").filter(Boolean);

    it("logs in without putting the password in argv", async () => {
      const result = await loginBitwardenForProcess({
        email: "learner@example.org",
        password: PASSWORD,
      });
      expect(result.ok).toBe(true);

      const argv = recordedArgv();
      expect(argv).not.toContain(PASSWORD);
      expect(argv.join(" ")).not.toContain(PASSWORD);
      // It goes through the environment instead.
      expect(argv).toContain("--passwordenv");
      expect(readFileSync(envLog, "utf8")).toBe(PASSWORD);
    });

    it("unlocks without putting the password in argv", async () => {
      const result = await unlockBitwardenForProcess(PASSWORD);
      expect(result.ok).toBe(true);

      const argv = recordedArgv();
      expect(argv.join(" ")).not.toContain(PASSWORD);
      expect(argv).toContain("--passwordenv");
      expect(readFileSync(envLog, "utf8")).toBe(PASSWORD);
    });

    it("does not leak the password into this process's own environment", async () => {
      await unlockBitwardenForProcess(PASSWORD);
      // The child gets BW_PASSWORD; the bridge process itself must not keep it,
      // or every later child would inherit it too.
      expect(process.env.BW_PASSWORD).toBeUndefined();
    });
  },
);
