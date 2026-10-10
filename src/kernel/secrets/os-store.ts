/**
 * OS-protected secret storage (ADR 2026-10-08b D5): the Keychain on macOS,
 * the Secret Service on Linux, DPAPI on Windows. It protects against other
 * users, other machines and backups — not against processes of the same user
 * — and ZAM claims no more.
 *
 * A secret always travels on stdin, never on a command line: `security -i`
 * reads its commands from stdin (the value hex-encoded), `secret-tool store`
 * reads the value from stdin, and the PowerShell DPAPI calls read it from
 * stdin too. No native module.
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type OsSecretStoreKind = "keychain" | "secret-service" | "dpapi";

export interface OsSecretStore {
  readonly kind: OsSecretStoreKind;
  /** Whether the store can hold a secret right now (a keyring daemon runs, …). */
  available(): Promise<boolean>;
  get(name: string): Promise<string | null>;
  /**
   * Several values in one go. DPAPI answers them with one PowerShell start
   * instead of one per value; other stores read them in parallel.
   */
  getMany?(names: string[]): Promise<Map<string, string | null>>;
  /** Returns whether the value was stored and reads back unchanged. */
  set(name: string, value: string): Promise<boolean>;
  delete(name: string): Promise<void>;
}

export type OsCommandRunner = (
  file: string,
  args: string[],
  input?: string,
) => Promise<{ code: number; stdout: string; stderr: string }>;

const SERVICE = "ZAM";
const NAME = /^[A-Za-z0-9._:-]{1,120}$/;

function assertName(name: string): void {
  if (!NAME.test(name)) throw new Error(`Invalid secret name: ${name}`);
}

/**
 * How long one store command may take. A store that waits for input it will
 * never get — `security` without a login keychain asks for a new one — must
 * not hold up a ZAM start.
 */
const OS_COMMAND_TIMEOUT_MS = 20_000;

/**
 * A runner for commands without a shell; a missing program is exit code 127,
 * one that runs past the time limit is killed and reported as 124.
 */
export const osCommandRunner =
  (timeoutMs = OS_COMMAND_TIMEOUT_MS): OsCommandRunner =>
  (file, args, input) =>
    new Promise((resolve) => {
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(file, args, { stdio: ["pipe", "pipe", "pipe"] });
      } catch {
        resolve({ code: 127, stdout: "", stderr: "" });
        return;
      }
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);
      timer.unref?.();
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      child.on("error", () => {
        clearTimeout(timer);
        resolve({ code: 127, stdout, stderr });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code: timedOut ? 124 : (code ?? 1), stdout, stderr });
      });
      child.stdin?.end(input ?? "");
    });

/** The runner every store uses. */
export const runOsCommand: OsCommandRunner = osCommandRunner();

function stripFinalNewline(text: string): string {
  return text.replace(/\r?\n$/, "");
}

function keychainStore(run: OsCommandRunner): OsSecretStore {
  return {
    kind: "keychain",
    async available() {
      // A session without a login keychain (another HOME, some SSH logins)
      // has no default one, and adding an item there would wait for input.
      return (await run("security", ["default-keychain"])).code === 0;
    },
    async get(name) {
      assertName(name);
      const res = await run("security", [
        "find-generic-password",
        "-a",
        name,
        "-s",
        SERVICE,
        "-w",
      ]);
      return res.code === 0 ? stripFinalNewline(res.stdout) : null;
    },
    async set(name, value) {
      assertName(name);
      const hex = Buffer.from(value, "utf8").toString("hex");
      await run(
        "security",
        ["-i"],
        `add-generic-password -U -a ${name} -s ${SERVICE} -X ${hex}\n`,
      );
      return (await this.get(name)) === value;
    },
    async delete(name) {
      assertName(name);
      await run("security", [
        "delete-generic-password",
        "-a",
        name,
        "-s",
        SERVICE,
      ]);
    },
  };
}

function secretServiceStore(run: OsCommandRunner): OsSecretStore {
  const attrs = (name: string) => ["service", SERVICE, "account", name];
  return {
    kind: "secret-service",
    async available() {
      // Without a keyring daemon (SSH, WSL) the lookup fails with a D-Bus
      // error rather than "not found".
      const res = await run("secret-tool", ["lookup", ...attrs("zam-probe")]);
      if (res.code === 127) return false;
      return !/d-?bus|autolaunch|secrets? service|org\.freedesktop/i.test(
        res.stderr,
      );
    },
    async get(name) {
      assertName(name);
      const res = await run("secret-tool", ["lookup", ...attrs(name)]);
      return res.code === 0 && res.stdout !== ""
        ? stripFinalNewline(res.stdout)
        : null;
    },
    async set(name, value) {
      assertName(name);
      const res = await run(
        "secret-tool",
        ["store", `--label=${SERVICE} ${name}`, ...attrs(name)],
        value,
      );
      return res.code === 0 && (await this.get(name)) === value;
    },
    async delete(name) {
      assertName(name);
      await run("secret-tool", ["clear", ...attrs(name)]);
    },
  };
}

/** PowerShell that reads a value on stdin and prints its DPAPI form. */
const DPAPI_PROTECT =
  "$v=[Console]::In.ReadToEnd();" +
  "$s=ConvertTo-SecureString -String $v -AsPlainText -Force;" +
  "[Console]::Out.Write((ConvertFrom-SecureString -SecureString $s))";

/**
 * PowerShell that reads one DPAPI blob per line on stdin and prints one line
 * per blob: the value in base64, or `-` when that blob does not decrypt.
 */
const DPAPI_UNPROTECT_MANY =
  "$o=@();" +
  "foreach($b in [Console]::In.ReadToEnd().Split([char]10)){" +
  "$b=$b.Trim();if(!$b){continue};" +
  "try{$s=ConvertTo-SecureString -String $b;" +
  "$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);" +
  "try{$v=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)}" +
  "finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)};" +
  "$o+=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($v))}" +
  "catch{$o+='-'}};" +
  "[Console]::Out.Write($o -join [char]10)";

/** PowerShell that reads a DPAPI blob on stdin and prints the value. */
const DPAPI_UNPROTECT =
  "$b=[Console]::In.ReadToEnd().Trim();" +
  "$s=ConvertTo-SecureString -String $b;" +
  "$p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s);" +
  "try{[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))}" +
  "finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}";

function dpapiStore(run: OsCommandRunner, dir: string): OsSecretStore {
  const ps = (script: string, input: string) =>
    run(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      input,
    );
  // A colon in a Windows file name names an NTFS stream; `~` cannot occur
  // in a secret name, so the mapping stays one to one.
  const fileOf = (name: string) =>
    join(dir, `${name.replace(/:/g, "~")}.dpapi`);
  return {
    kind: "dpapi",
    async available() {
      return (await ps("exit 0", "")).code === 0;
    },
    async get(name) {
      assertName(name);
      const file = fileOf(name);
      if (!existsSync(file)) return null;
      const res = await ps(DPAPI_UNPROTECT, readFileSync(file, "utf8"));
      return res.code === 0 ? res.stdout : null;
    },
    async getMany(names) {
      const out = new Map<string, string | null>();
      const present: Array<{ name: string; blob: string }> = [];
      for (const name of names) {
        assertName(name);
        const file = fileOf(name);
        if (existsSync(file)) {
          present.push({ name, blob: readFileSync(file, "utf8").trim() });
        } else {
          out.set(name, null);
        }
      }
      if (present.length === 0) return out;
      const res = await ps(
        DPAPI_UNPROTECT_MANY,
        present.map((entry) => entry.blob).join("\n"),
      );
      const lines = res.code === 0 ? res.stdout.split(/\r?\n/) : [];
      present.forEach((entry, index) => {
        const line = lines[index]?.trim();
        out.set(
          entry.name,
          line && line !== "-"
            ? Buffer.from(line, "base64").toString("utf8")
            : null,
        );
      });
      return out;
    },
    async set(name, value) {
      assertName(name);
      const res = await ps(DPAPI_PROTECT, value);
      if (res.code !== 0 || !res.stdout.trim()) return false;
      mkdirSync(dir, { recursive: true });
      writeFileSync(fileOf(name), res.stdout.trim(), { mode: 0o600 });
      return (await this.get(name)) === value;
    },
    async delete(name) {
      assertName(name);
      rmSync(fileOf(name), { force: true });
    },
  };
}

/**
 * The store for this platform, or null when there is none. Setting
 * `ZAM_OS_SECRET_STORE=off` turns it off: secrets are then not remembered.
 * The test setup does so, so no test writes the developer's keychain.
 */
export function createOsSecretStore(
  platform: NodeJS.Platform = process.platform,
  run: OsCommandRunner = runOsCommand,
  opts: { dpapiDir?: string } = {},
): OsSecretStore | null {
  if (process.env.ZAM_OS_SECRET_STORE === "off") return null;
  if (platform === "darwin") return keychainStore(run);
  if (platform === "win32") {
    return dpapiStore(run, opts.dpapiDir ?? join(homedir(), ".zam", "secrets"));
  }
  if (platform === "linux") return secretServiceStore(run);
  return null;
}

let override: OsSecretStore | null | undefined;

/** The store ZAM uses; tests replace it with {@link setOsSecretStoreForTests}. */
export function defaultOsSecretStore(): OsSecretStore | null {
  return override !== undefined ? override : createOsSecretStore();
}

export function setOsSecretStoreForTests(
  store: OsSecretStore | null | undefined,
): void {
  override = store;
}
