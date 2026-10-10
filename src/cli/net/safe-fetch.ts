/**
 * One outbound fetcher for every request ZAM starts to a URL it did not choose
 * itself (ADR 2026-10-08b D2): source links, web imports, curriculum pages.
 * Model endpoints keep their own clients but use the same address check.
 *
 * Built on `node:http`/`node:https` with a `lookup` that validates every
 * resolved address and pins the connection to it, so a name cannot resolve to
 * a public address for the check and to a private one for the connection.
 * `globalThis.fetch` offers no such hook.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import type { Readable } from "node:stream";
import zlib from "node:zlib";

// ── Address classes ──────────────────────────────────────────────────────────

export type AddressClass =
  | "public"
  | "loopback"
  | "private"
  | "shared"
  | "unique-local"
  | "link-local"
  | "multicast"
  | "reserved";

function classifyIPv4(bytes: readonly number[]): AddressClass {
  const [a, b, c] = bytes;
  if (a === 127) return "loopback";
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
    return "private";
  if (a === 100 && b >= 64 && b <= 127) return "shared";
  if (a === 169 && b === 254) return "link-local";
  if (a >= 224 && a <= 239) return "multicast";
  if (
    a === 0 ||
    a >= 240 ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  )
    return "reserved";
  return "public";
}

/** Sixteen bytes of an IPv6 address in any notation, or null. */
function parseIPv6(input: string): number[] | null {
  let text = input.toLowerCase().split("%", 1)[0];
  if (text.startsWith("[") && text.endsWith("]")) text = text.slice(1, -1);
  if (isIP(text) !== 6) return null;
  let tail: number[] = [];
  const lastColon = text.lastIndexOf(":");
  const last = text.slice(lastColon + 1);
  if (last.includes(".")) {
    tail = last.split(".").map(Number);
    text = `${text.slice(0, lastColon + 1)}0:0`;
  }
  const [head, rest] = text.split("::");
  const left = head ? head.split(":") : [];
  const right = rest !== undefined && rest !== "" ? rest.split(":") : [];
  const fill =
    rest === undefined
      ? []
      : new Array(8 - left.length - right.length).fill("0");
  const groups = [...left, ...fill, ...right].map((g) =>
    Number.parseInt(g, 16),
  );
  if (groups.length !== 8 || groups.some((g) => Number.isNaN(g))) return null;
  const bytes = groups.flatMap((g) => [g >> 8, g & 0xff]);
  if (tail.length === 4) bytes.splice(12, 4, ...tail);
  return bytes;
}

function classifyIPv6(bytes: readonly number[]): AddressClass {
  const zeroUpTo = (n: number) => bytes.slice(0, n).every((b) => b === 0);
  const v4 = bytes.slice(12);
  if (zeroUpTo(15) && bytes[15] === 0) return "reserved"; // ::
  if (zeroUpTo(15) && bytes[15] === 1) return "loopback"; // ::1
  // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d) and NAT64
  // (64:ff9b::a.b.c.d) carry an IPv4 address that decides the class.
  if (zeroUpTo(10) && bytes[10] === 0xff && bytes[11] === 0xff)
    return classifyIPv4(v4);
  if (zeroUpTo(12)) return classifyIPv4(v4);
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x64 &&
    bytes[2] === 0xff &&
    bytes[3] === 0x9b &&
    bytes.slice(4, 12).every((b) => b === 0)
  )
    return classifyIPv4(v4);
  // 6to4 (2002::/16) embeds an IPv4 address in bytes 2–5.
  if (bytes[0] === 0x20 && bytes[1] === 0x02) {
    const embedded = classifyIPv4(bytes.slice(2, 6));
    return embedded === "public" ? "public" : embedded;
  }
  if ((bytes[0] & 0xfe) === 0xfc) return "unique-local"; // fc00::/7
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return "link-local"; // fe80::/10
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0xc0) return "private"; // fec0::/10, deprecated site-local
  if (bytes[0] === 0xff) return "multicast";
  // Documentation (2001:db8::/32), Teredo (2001::/32) and discard (100::/64).
  if (
    bytes[0] === 0x20 &&
    bytes[1] === 0x01 &&
    bytes[2] === 0x0d &&
    bytes[3] === 0xb8
  )
    return "reserved";
  if (
    bytes[0] === 0x20 &&
    bytes[1] === 0x01 &&
    bytes[2] === 0 &&
    bytes[3] === 0
  )
    return "reserved";
  if (
    bytes[0] === 0x01 &&
    bytes[1] === 0x00 &&
    bytes.slice(2, 8).every((b) => b === 0)
  )
    return "reserved";
  return "public";
}

/** The class of an IP address literal, in any IPv4 or IPv6 notation. */
export function classifyAddress(address: string): AddressClass {
  const text = address.trim();
  if (isIP(text) === 4) return classifyIPv4(text.split(".").map(Number));
  const v6 = parseIPv6(text);
  return v6 ? classifyIPv6(v6) : "reserved";
}

// ── Endpoint locality ────────────────────────────────────────────────────────

export type EndpointLocality = "local" | "lan" | "cloud";

/**
 * Locality from the parsed host alone (ADR 2026-10-08b D2): loopback is
 * `local`, private ranges and private-use names are `lan`, everything else is
 * `cloud`. A row's stored `local` flag is a display hint and never widens it.
 */
export function localityOfHost(hostname: string): EndpointLocality {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (isIP(host)) {
    const kind = classifyAddress(host);
    if (kind === "loopback") return "local";
    if (kind === "private" || kind === "shared" || kind === "unique-local")
      return "lan";
    return "cloud";
  }
  if (host === "localhost" || host.endsWith(".localhost")) return "local";
  if (
    host.endsWith(".local") ||
    host.endsWith(".home.arpa") ||
    host.endsWith(".internal")
  )
    return "lan";
  return "cloud";
}

/** Locality of a URL's host; `cloud` when the URL does not parse. */
export function endpointLocality(url: string): EndpointLocality {
  try {
    return localityOfHost(new URL(url).hostname);
  } catch {
    return "cloud";
  }
}

/** Which address classes a request may reach. */
export type AddressPolicy = "public" | EndpointLocality;

function addressAllowed(kind: AddressClass, policy: AddressPolicy): boolean {
  if (kind === "public") return true;
  // Link-local (metadata services), multicast and reserved ranges are never
  // reachable; loopback and private ranges only for local and LAN endpoints.
  if (policy === "local" || policy === "lan") {
    return (
      kind === "loopback" ||
      kind === "private" ||
      kind === "shared" ||
      kind === "unique-local"
    );
  }
  return false;
}

export class BlockedTargetError extends Error {
  readonly code = "blocked-target";
  /** True when the name did not resolve at all, rather than to a refused address. */
  readonly unresolved: boolean;
  constructor(message: string, unresolved = false) {
    super(message);
    this.name = "BlockedTargetError";
    this.unresolved = unresolved;
  }
}

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export type Resolver = (hostname: string) => Promise<ResolvedAddress[]>;

const systemResolver: Resolver = async (hostname) =>
  (await dns.promises.lookup(hostname, { all: true, verbatim: true })).map(
    (entry) => ({ address: entry.address, family: entry.family === 6 ? 6 : 4 }),
  );

/**
 * Check a URL against a policy and return the addresses a connection may use.
 * Every resolved address must pass: a name that also resolves to a private
 * address is refused, not half-allowed.
 */
export async function resolveAllowedTarget(
  rawUrl: string,
  policy: AddressPolicy,
  resolve: Resolver = systemResolver,
): Promise<{ url: URL; addresses: ResolvedAddress[] }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BlockedTargetError(`Not a URL: ${rawUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedTargetError(
      `Only http and https are allowed: ${url.protocol}`,
    );
  }
  if (url.username || url.password) {
    throw new BlockedTargetError("URLs with credentials are not fetched");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses: ResolvedAddress[] = isIP(host)
    ? [{ address: host, family: isIP(host) === 6 ? 6 : 4 }]
    : await resolve(host).catch((err: unknown) => {
        throw new BlockedTargetError(
          `Cannot resolve ${host}: ${err instanceof Error ? err.message : String(err)}`,
          true,
        );
      });
  if (addresses.length === 0) {
    throw new BlockedTargetError(`Cannot resolve ${host}`, true);
  }
  for (const { address } of addresses) {
    const kind = classifyAddress(address);
    if (!addressAllowed(kind, policy)) {
      throw new BlockedTargetError(
        `Access denied to ${host}: it resolves to a ${kind} address`,
      );
    }
  }
  return { url, addresses };
}

/**
 * Check a model endpoint before a call (ADR 2026-10-08b D2): the policy is the
 * locality of its parsed host, so a cloud name that resolves to a private
 * address is refused, and metadata ranges are refused for every row.
 */
export async function assertModelEndpointAllowed(
  url: string,
  resolve: Resolver = systemResolver,
): Promise<void> {
  try {
    await resolveAllowedTarget(url, endpointLocality(url), resolve);
  } catch (err) {
    // A name that does not resolve cannot reach a refused address either;
    // the call itself reports the failure.
    if (err instanceof BlockedTargetError && err.unresolved) return;
    throw err;
  }
}

// ── The fetcher ──────────────────────────────────────────────────────────────

export interface SafeResponse {
  ok: boolean;
  status: number;
  statusText: string;
  /** The URL that answered, after redirects. */
  url: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** One request to one checked target; replaceable in tests. */
export type SafeTransport = (
  url: URL,
  addresses: ResolvedAddress[],
  options: {
    headers: Record<string, string>;
    maxBytes: number;
    deadline: number;
  },
) => Promise<{
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Buffer;
}>;

export interface SafeFetchOptions {
  /** Default `public`: no loopback, private, link-local or reserved target. */
  policy?: AddressPolicy;
  headers?: Record<string, string>;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  resolve?: Resolver;
  transport?: SafeTransport;
}

export const SAFE_FETCH_MAX_BYTES = 2 * 1024 * 1024;
export const SAFE_FETCH_TIMEOUT_MS = 15_000;
export const SAFE_FETCH_MAX_REDIRECTS = 5;

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

function decompress(stream: Readable, encoding: string | undefined): Readable {
  switch ((encoding ?? "").trim().toLowerCase()) {
    case "gzip":
    case "x-gzip":
      return stream.pipe(zlib.createGunzip());
    case "deflate":
      return stream.pipe(zlib.createInflate());
    case "br":
      return stream.pipe(zlib.createBrotliDecompress());
    default:
      return stream;
  }
}

/** The real transport: the connection can only use the checked addresses. */
const nodeTransport: SafeTransport = (url, addresses, options) =>
  new Promise((resolvePromise, reject) => {
    const pinned: LookupFunction = (_hostname, lookupOptions, callback) => {
      const wantAll =
        typeof lookupOptions === "object" &&
        lookupOptions !== null &&
        (lookupOptions as dns.LookupOptions).all === true;
      if (wantAll) {
        (callback as (err: null, list: dns.LookupAddress[]) => void)(
          null,
          addresses.map((a) => ({ address: a.address, family: a.family })),
        );
      } else {
        (callback as (err: null, address: string, family: number) => void)(
          null,
          addresses[0].address,
          addresses[0].family,
        );
      }
    };
    const remaining = options.deadline - Date.now();
    if (remaining <= 0) {
      reject(new Error("Request timed out"));
      return;
    }
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(
      url,
      {
        method: "GET",
        headers: { "accept-encoding": "gzip, deflate, br", ...options.headers },
        lookup: pinned,
        timeout: remaining,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        const body = decompress(response, response.headers["content-encoding"]);
        body.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > options.maxBytes) {
            request.destroy(
              new Error(`Response exceeds ${options.maxBytes} bytes`),
            );
            body.destroy();
            reject(new Error(`Response exceeds ${options.maxBytes} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        body.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [name, value] of Object.entries(response.headers)) {
            if (value !== undefined)
              headers[name] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolvePromise({
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            headers,
            body: Buffer.concat(chunks),
          });
        });
        body.on("error", reject);
      },
    );
    const timer = setTimeout(
      () => request.destroy(new Error("Request timed out")),
      remaining,
    );
    request.on("timeout", () =>
      request.destroy(new Error("Request timed out")),
    );
    request.on("error", reject);
    request.on("close", () => clearTimeout(timer));
    request.end();
  });

/**
 * GET a URL through the address check, following at most five redirects by
 * hand and checking each hop. No cookies are kept or sent.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeResponse> {
  const policy = options.policy ?? "public";
  const maxBytes = options.maxBytes ?? SAFE_FETCH_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? SAFE_FETCH_MAX_REDIRECTS;
  const deadline = Date.now() + (options.timeoutMs ?? SAFE_FETCH_TIMEOUT_MS);
  const transport = options.transport ?? nodeTransport;
  const headers = { ...(options.headers ?? {}) };
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === "cookie") delete headers[name];
  }

  let current = rawUrl;
  for (let hop = 0; ; hop++) {
    const { url, addresses } = await resolveAllowedTarget(
      current,
      policy,
      options.resolve,
    );
    const response = await transport(url, addresses, {
      headers,
      maxBytes,
      deadline,
    });
    const location = response.headers.location;
    if (REDIRECTS.has(response.status) && location) {
      if (hop >= maxRedirects) {
        throw new BlockedTargetError(`More than ${maxRedirects} redirects`);
      }
      current = new URL(location, url).href;
      continue;
    }
    const body = response.body;
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      url: url.href,
      headers: {
        get: (name) => response.headers[name.toLowerCase()] ?? null,
      },
      text: async () => body.toString("utf-8"),
      arrayBuffer: async () =>
        body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer,
    };
  }
}
