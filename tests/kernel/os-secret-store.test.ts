/**
 * ADR 2026-10-08b D5: OS-protected storage. A secret reaches the Keychain,
 * the Secret Service or DPAPI on stdin, never on a command line.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createOsSecretStore,
  type OsCommandRunner,
} from "../../src/kernel/index.js";

const SECRET = "sk-Fake5ecret+/=value";

/** A runner that records calls and answers like the real tools would. */
function recorder(
  answer: (
    file: string,
    args: string[],
    input: string,
  ) => {
    code: number;
    stdout?: string;
    stderr?: string;
  },
) {
  const calls: Array<{ file: string; args: string[]; input: string }> = [];
  const run: OsCommandRunner = async (file, args, input = "") => {
    calls.push({ file, args, input });
    const res = answer(file, args, input);
    return {
      code: res.code,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? "",
    };
  };
  return { run, calls };
}

describe("OS secret stores keep secrets off the command line", () => {
  let saved: string | undefined;
  let dir: string;

  beforeEach(() => {
    saved = process.env.ZAM_OS_SECRET_STORE;
    delete process.env.ZAM_OS_SECRET_STORE;
    dir = mkdtempSync(join(tmpdir(), "zam-os-store-"));
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.ZAM_OS_SECRET_STORE;
    else process.env.ZAM_OS_SECRET_STORE = saved;
    rmSync(dir, { recursive: true, force: true });
  });

  it("macOS Keychain: the value goes hex-encoded through security -i on stdin", async () => {
    let stored: string | null = null;
    const { run, calls } = recorder((_file, args, input) => {
      if (args[0] === "-i") {
        const hex = /-X ([0-9a-f]+)/.exec(input)?.[1] ?? "";
        stored = Buffer.from(hex, "hex").toString("utf8");
        return { code: 0 };
      }
      if (args[0] === "find-generic-password") {
        return stored === null
          ? { code: 44 }
          : { code: 0, stdout: `${stored}\n` };
      }
      return { code: 0 };
    });
    const store = createOsSecretStore("darwin", run);
    expect(store?.kind).toBe("keychain");
    expect(await store?.set("credential:openrouter", SECRET)).toBe(true);
    expect(await store?.get("credential:openrouter")).toBe(SECRET);
    for (const call of calls) {
      expect(call.args.join(" ")).not.toContain(SECRET);
      expect(call.args.join(" ")).not.toContain(
        Buffer.from(SECRET).toString("hex"),
      );
    }
  });

  it("Linux Secret Service: secret-tool store reads the value on stdin", async () => {
    let stored: string | null = null;
    const { run, calls } = recorder((_file, args, input) => {
      if (args[0] === "store") {
        stored = input;
        return { code: 0 };
      }
      if (args[0] === "lookup") {
        return stored === null ? { code: 1 } : { code: 0, stdout: stored };
      }
      return { code: 0 };
    });
    const store = createOsSecretStore("linux", run);
    expect(await store?.set("bitwarden-session", SECRET)).toBe(true);
    expect(await store?.get("bitwarden-session")).toBe(SECRET);
    expect(calls.some((call) => call.args.join(" ").includes(SECRET))).toBe(
      false,
    );
  });

  it("Linux without a keyring daemon is not available", async () => {
    const { run } = recorder(() => ({
      code: 1,
      stderr: "Cannot autolaunch D-Bus without X11 $DISPLAY",
    }));
    expect(await createOsSecretStore("linux", run)?.available()).toBe(false);
    const missing = recorder(() => ({ code: 127 }));
    expect(await createOsSecretStore("linux", missing.run)?.available()).toBe(
      false,
    );
  });

  it("Windows DPAPI: the value and the blob go through PowerShell on stdin", async () => {
    const { run, calls } = recorder((_file, args, input) => {
      const script = args[args.length - 1];
      if (script.includes("ConvertFrom-SecureString")) {
        return {
          code: 0,
          stdout: `BLOB:${Buffer.from(input).toString("hex")}`,
        };
      }
      if (script.includes("PtrToStringBSTR")) {
        return {
          code: 0,
          stdout: Buffer.from(input.replace("BLOB:", ""), "hex").toString(
            "utf8",
          ),
        };
      }
      return { code: 0 };
    });
    const store = createOsSecretStore("win32", run, { dpapiDir: dir });
    expect(await store?.set("credential:openrouter", SECRET)).toBe(true);
    // No colon in the file name: on NTFS it would name a stream.
    const file = join(dir, "credential~openrouter.dpapi");
    expect(readFileSync(file, "utf8")).not.toContain(SECRET);
    expect(await store?.get("credential:openrouter")).toBe(SECRET);
    for (const call of calls) {
      expect(call.args.join(" ")).not.toContain(SECRET);
    }
    await store?.delete("credential:openrouter");
    expect(existsSync(file)).toBe(false);
  });

  it("refuses names that could escape the store's own namespace", async () => {
    const { run } = recorder(() => ({ code: 0 }));
    const store = createOsSecretStore("darwin", run);
    await expect(store?.set("x -s other", SECRET)).rejects.toThrow(
      /Invalid secret name/,
    );
  });

  it("is off when ZAM_OS_SECRET_STORE=off, as in every test", () => {
    process.env.ZAM_OS_SECRET_STORE = "off";
    expect(createOsSecretStore("darwin")).toBeNull();
  });
});
