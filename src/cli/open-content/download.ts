import { createHash, randomBytes } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { OpenContentCatalogItem } from "./catalog.js";

export type OpenContentFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface OpenContentDownloadOptions {
  cacheDir?: string;
  fetchImpl?: OpenContentFetch;
  timeoutMs?: number;
}

export interface OpenContentDownloadResult {
  path: string;
  cached: boolean;
  sha256: string;
  byteSize: number;
}

export function getOpenContentCacheDir(home: string = homedir()): string {
  return join(home, ".zam", "open-content");
}

export function getOpenContentCachePath(
  item: OpenContentCatalogItem,
  cacheDir: string = getOpenContentCacheDir(),
): string {
  return join(cacheDir, `${item.id}-${item.artifact.sha256}.apkg`);
}

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

async function hasVerifiedCache(
  path: string,
  item: OpenContentCatalogItem,
): Promise<boolean> {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) return false;
    if (info.size !== item.artifact.byteSize) return false;
    return sha256(await readFile(path)) === item.artifact.sha256;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function validateFinalUrl(
  response: Response,
  item: OpenContentCatalogItem,
): void {
  const value = response.url || item.artifact.downloadUrl;
  let finalUrl: URL;
  try {
    finalUrl = new URL(value);
  } catch {
    throw new Error("Open-content download returned an invalid final URL");
  }
  if (
    finalUrl.protocol !== "https:" ||
    (finalUrl.port !== "" && finalUrl.port !== "443") ||
    !item.artifact.allowedDownloadHosts.includes(finalUrl.hostname)
  ) {
    throw new Error(
      `Open-content download redirected to an untrusted host: ${finalUrl.hostname}`,
    );
  }
}

async function readExactBody(
  response: Response,
  expectedBytes: number,
): Promise<Uint8Array> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    const parsed = Number(contentLength);
    if (!Number.isSafeInteger(parsed) || parsed !== expectedBytes) {
      throw new Error(
        `Open-content download size mismatch: expected ${expectedBytes} bytes, received ${contentLength}`,
      );
    }
  }
  if (!response.body) {
    throw new Error("Open-content download returned an empty response body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      total += chunk.value.byteLength;
      if (total > expectedBytes) {
        await reader.cancel();
        throw new Error(
          `Open-content download exceeds its verified ${expectedBytes}-byte size`,
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total !== expectedBytes) {
    throw new Error(
      `Open-content download size mismatch: expected ${expectedBytes} bytes, received ${total}`,
    );
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

/**
 * Download one catalog-owned artifact into a content-addressed local cache.
 * Cache hits are re-hashed before use; remote bodies are bounded while read.
 */
export async function downloadOpenContentArtifact(
  item: OpenContentCatalogItem,
  options: OpenContentDownloadOptions = {},
): Promise<OpenContentDownloadResult> {
  const cacheDir = options.cacheDir ?? getOpenContentCacheDir();
  const path = getOpenContentCachePath(item, cacheDir);
  await mkdir(cacheDir, { recursive: true, mode: 0o700 });
  if (await hasVerifiedCache(path, item)) {
    return {
      path,
      cached: true,
      sha256: item.artifact.sha256,
      byteSize: item.artifact.byteSize,
    };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(item.artifact.downloadUrl, {
      method: "GET",
      redirect: "follow",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  } catch (error) {
    throw new Error(
      `Could not download ${item.title}. Check your connection and try again: ${(error as Error).message}`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `Could not download ${item.title}: HTTP ${response.status}`,
    );
  }
  validateFinalUrl(response, item);
  const body = await readExactBody(response, item.artifact.byteSize);
  const actualHash = sha256(body);
  if (actualHash !== item.artifact.sha256) {
    throw new Error(
      `Integrity check failed for ${item.title}; the downloaded file was not imported`,
    );
  }

  const temporaryPath = `${path}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await writeFile(temporaryPath, body, { flag: "wx", mode: 0o600 });
    // An invalid cache entry is owned by this feature and safe to replace.
    await unlink(path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    await rename(temporaryPath, path);
  } finally {
    await unlink(temporaryPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  return {
    path,
    cached: false,
    sha256: actualHash,
    byteSize: body.byteLength,
  };
}
