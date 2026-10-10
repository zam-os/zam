/**
 * Paths named by a caller are confined (ADR 2026-10-08b D1).
 *
 * One resolver decides every path that a tool argument or a stored link
 * names. A path is usable only inside an allowed root: the MCP client's roots
 * and the folders the learner trusts in `~/.zam/config.json`
 * (`trustedFolders[]`). A drive root, the home directory or any ancestor of
 * it is never a root, whatever its source.
 */
import {
  closeSync,
  existsSync,
  fstatSync,
  openSync,
  readSync,
  realpathSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";
import { loadInstallConfig, updateInstallConfig } from "./install-config.js";

export const PATH_OUTSIDE_TRUSTED_FOLDERS = "path-outside-trusted-folders";
export const PATH_NOT_READABLE = "path-not-readable";

/** The one action that fixes a refusal. */
export const TRUST_FOLDER_HINT =
  "To use it, trust its folder in ZAM Settings → Data, or run `zam trust add <folder>`.";

export type PathRefusalCode =
  | typeof PATH_OUTSIDE_TRUSTED_FOLDERS
  | typeof PATH_NOT_READABLE;

/** A typed refusal; `code` is stable, `message` says what to do. */
export class PathRefusedError extends Error {
  readonly code: PathRefusalCode;
  readonly target: string;
  constructor(code: PathRefusalCode, target: string, message: string) {
    super(message);
    this.name = "PathRefusedError";
    this.code = code;
    this.target = target;
  }
}

function outside(target: string): PathRefusedError {
  return new PathRefusedError(
    PATH_OUTSIDE_TRUSTED_FOLDERS,
    target,
    `${target} is outside the folders ZAM may read. ${TRUST_FOLDER_HINT}`,
  );
}

function notReadable(target: string, why: string): PathRefusedError {
  return new PathRefusedError(
    PATH_NOT_READABLE,
    target,
    `ZAM does not read ${target}: ${why}.`,
  );
}

const caseInsensitive = process.platform === "win32";

function samePath(a: string, b: string): boolean {
  return caseInsensitive ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** Whether `target` is `root` or lies below it. */
export function isInside(root: string, target: string): boolean {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function realPath(path: string): string {
  return realpathSync.native(path);
}

/**
 * Whether a folder may be an allowed root: never a drive root, the home
 * directory or an ancestor of it.
 */
export function isAcceptableRoot(dir: string, home = homedir()): boolean {
  let real: string;
  let realHome: string;
  try {
    real = realPath(resolve(dir));
    realHome = existsSync(home) ? realPath(home) : resolve(home);
  } catch {
    return false;
  }
  if (samePath(parse(real).root, real)) return false;
  if (samePath(real, realHome)) return false;
  if (isInside(real, realHome)) return false;
  return true;
}

/**
 * Canonical allowed roots from any mix of paths and `file:` URIs: existing
 * directories only, real paths, acceptable roots only, no duplicates.
 */
export function canonicalRoots(candidates: Iterable<string>): string[] {
  const roots: string[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    let dir: string;
    try {
      dir = candidate.startsWith("file:")
        ? fileURLToPath(candidate)
        : resolve(candidate);
    } catch {
      continue;
    }
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    if (!isAcceptableRoot(dir)) continue;
    const real = realPath(dir);
    if (!roots.some((root) => samePath(root, real))) roots.push(real);
  }
  return roots;
}

// ── Trusted folders in config.json ───────────────────────────────────────────

/** The folders this learner trusts on this machine, as stored. */
export function getTrustedFolders(configPath?: string): string[] {
  const stored = loadInstallConfig(configPath).trustedFolders;
  return Array.isArray(stored)
    ? stored.filter((dir): dir is string => typeof dir === "string")
    : [];
}

/** Trusted folders that exist and are acceptable, ready to use as roots. */
export function trustedRoots(configPath?: string): string[] {
  return canonicalRoots(getTrustedFolders(configPath));
}

/**
 * Trust a folder. Refuses a drive root, the home directory and its
 * ancestors, and folders that do not exist. Returns the stored real path.
 */
export function addTrustedFolder(dir: string, configPath?: string): string {
  const absolute = resolve(dir);
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) {
    throw new Error(`Not a folder: ${absolute}`);
  }
  if (!isAcceptableRoot(absolute)) {
    throw new Error(
      `ZAM does not trust ${absolute}: a drive root, your home folder or a folder above it would open every file in it.`,
    );
  }
  const real = realPath(absolute);
  updateInstallConfig((config) => {
    const current = Array.isArray(config.trustedFolders)
      ? config.trustedFolders
      : [];
    if (!current.some((existing) => samePath(existing, real))) {
      config.trustedFolders = [...current, real];
    }
  }, configPath);
  return real;
}

/** Stop trusting a folder; returns whether it was trusted. */
export function removeTrustedFolder(dir: string, configPath?: string): boolean {
  const absolute = resolve(dir);
  const real = existsSync(absolute) ? realPath(absolute) : absolute;
  return updateInstallConfig((config) => {
    const current = Array.isArray(config.trustedFolders)
      ? config.trustedFolders
      : [];
    const next = current.filter(
      (existing) => !samePath(existing, real) && !samePath(existing, absolute),
    );
    config.trustedFolders = next;
    return next.length !== current.length;
  }, configPath);
}

// ── Resolution ───────────────────────────────────────────────────────────────

/** Device paths, `\\?\` long paths and NTFS alternate data streams. */
function assertPlainPath(raw: string): void {
  if (/^[\\/]{2}[?.][\\/]/.test(raw)) {
    throw notReadable(raw, "device and long-path prefixes are not accepted");
  }
  const withoutDrive = raw.replace(/^[A-Za-z]:/, "");
  if (withoutDrive.includes(":")) {
    throw notReadable(raw, "a colon in a file name names an alternate stream");
  }
}

export interface ResolvedTrustedPath {
  /** Real path of the target (or of its parent plus name, for a new file). */
  path: string;
  /** The allowed root it lies in. */
  root: string;
}

/**
 * Resolve a path inside the allowed roots. An absolute path must lie in a
 * root; a relative one is tried against each root in turn, never against the
 * working directory. Symlinks and junctions are resolved before the check.
 * With `mustExist: false`, a missing file resolves through its parent folder.
 */
export function resolveTrustedPath(
  raw: string,
  roots: readonly string[],
  opts: { mustExist?: boolean } = {},
): ResolvedTrustedPath {
  const mustExist = opts.mustExist ?? true;
  const target = raw.trim();
  assertPlainPath(target);
  if (
    /^[\\/]{2}/.test(target) &&
    !roots.some((root) => /^[\\/]{2}/.test(root))
  ) {
    throw outside(target);
  }
  const candidates = isAbsolute(target)
    ? [resolve(target)]
    : roots.map((root) => resolve(root, target));

  // Only the real path decides: symlinks, junctions and aliases such as
  // macOS's /var → /private/var are resolved before any containment check.
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const real = realPath(candidate);
      const root = roots.find((r) => isInside(r, real));
      if (root) return { path: real, root };
      continue;
    }
    if (mustExist) continue;
    const parent = dirname(candidate);
    if (!existsSync(parent)) continue;
    const realParent = realPath(parent);
    const root = roots.find((r) => isInside(r, realParent));
    if (root) return { path: join(realParent, basename(candidate)), root };
  }
  throw outside(target);
}

/** Refuse dotfiles and anything inside a dot-directory below the root. */
export function assertNoHiddenSegments(path: string, root: string): void {
  const rel = relative(root, path);
  if (rel.split(/[\\/]/).some((segment) => segment.startsWith("."))) {
    throw notReadable(
      path,
      "hidden files and folders such as .ssh, .git or .env are never read",
    );
  }
}

/**
 * File types a stored source link may point at (owner decision 2026-10-10):
 * Markdown and plain text, common source code, and configuration files.
 * Images are never read as text.
 */
export const TEXT_SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([
  // Text
  "md",
  "mdx",
  "markdown",
  "txt",
  "rst",
  "adoc",
  "asciidoc",
  "org",
  "tex",
  "csv",
  "tsv",
  // Source code
  "ts",
  "tsx",
  "mts",
  "cts",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "pyi",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "scala",
  "swift",
  "m",
  "mm",
  "c",
  "h",
  "cc",
  "cpp",
  "cxx",
  "hpp",
  "hh",
  "cs",
  "fs",
  "fsx",
  "vb",
  "php",
  "pl",
  "pm",
  "lua",
  "r",
  "jl",
  "dart",
  "ex",
  "exs",
  "erl",
  "hs",
  "clj",
  "elm",
  "sql",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "psm1",
  "psd1",
  "bat",
  "cmd",
  "vue",
  "svelte",
  "astro",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "xsd",
  "xsl",
  "graphql",
  "gql",
  "proto",
  "tf",
  "hcl",
  "nix",
  "gradle",
  "cmake",
  "mk",
  // Configuration
  "json",
  "jsonc",
  "json5",
  "yaml",
  "yml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "properties",
]);

/** A source link reads at most this much text. */
export const MAX_SOURCE_FILE_BYTES = 2 * 1024 * 1024;

export interface ReadTrustedFileOptions {
  extensions?: ReadonlySet<string>;
  maxBytes?: number;
}

/**
 * Read a text file inside the allowed roots. Refuses hidden paths, file types
 * outside the list and oversized files. The file is opened, and the opened
 * file's identity is compared with the checked path, which closes the gap
 * between check and read.
 */
export function readTrustedTextFile(
  raw: string,
  roots: readonly string[],
  opts: ReadTrustedFileOptions = {},
): { path: string; root: string; content: string } {
  const { path, root } = resolveTrustedPath(raw, roots);
  assertNoHiddenSegments(path, root);
  const extensions = opts.extensions ?? TEXT_SOURCE_EXTENSIONS;
  const ext = extname(path).slice(1).toLowerCase();
  if (!extensions.has(ext)) {
    throw notReadable(
      path,
      `.${ext || "(none)"} is not a text file type ZAM reads`,
    );
  }
  const checked = statSync(path);
  if (!checked.isFile()) throw notReadable(path, "it is not a file");
  const maxBytes = opts.maxBytes ?? MAX_SOURCE_FILE_BYTES;

  const fd = openSync(path, "r");
  try {
    const opened = fstatSync(fd);
    if (opened.dev !== checked.dev || opened.ino !== checked.ino) {
      throw notReadable(path, "it changed while ZAM was checking it");
    }
    if (opened.size > maxBytes) {
      throw notReadable(path, `it is larger than ${maxBytes} bytes`);
    }
    const buffer = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < buffer.length) {
      const read = readSync(fd, buffer, offset, buffer.length - offset, offset);
      if (read === 0) break;
      offset += read;
    }
    return {
      path,
      root,
      content: buffer.subarray(0, offset).toString("utf-8"),
    };
  } finally {
    closeSync(fd);
  }
}
