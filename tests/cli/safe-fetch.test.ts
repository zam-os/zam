/**
 * ADR 2026-10-08b D2: one outbound fetcher. Every hop is checked, every
 * resolved address must pass, and the connection can only use the addresses
 * that passed.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertModelEndpointAllowed,
  BlockedTargetError,
  classifyAddress,
  endpointLocality,
  localityOfHost,
  type Resolver,
  resolveAllowedTarget,
  type SafeTransport,
  safeFetch,
} from "../../src/cli/net/safe-fetch.js";
import { resolveReviewContext } from "../../src/cli/review-context.js";
import { clearReviewContextCache } from "../../src/kernel/index.js";

const resolverFor =
  (table: Record<string, string[]>): Resolver =>
  async (hostname) => {
    const list = table[hostname];
    if (!list) throw new Error(`ENOTFOUND ${hostname}`);
    return list.map((address) => ({
      address,
      family: address.includes(":") ? 6 : 4,
    }));
  };

describe("classifyAddress", () => {
  it.each([
    ["93.184.216.34", "public"],
    ["2606:2800:220:1:248:1893:25c8:1946", "public"],
    ["127.0.0.1", "loopback"],
    ["127.9.9.9", "loopback"],
    ["::1", "loopback"],
    ["0:0:0:0:0:0:0:1", "loopback"],
    ["[::1]", "loopback"],
    ["::ffff:127.0.0.1", "loopback"],
    ["::ffff:7f00:1", "loopback"],
    ["::127.0.0.1", "loopback"],
    ["64:ff9b::7f00:1", "loopback"],
    ["10.0.0.1", "private"],
    ["172.16.5.4", "private"],
    ["192.168.1.1", "private"],
    ["::ffff:10.0.0.1", "private"],
    ["::ffff:a00:1", "private"],
    ["2002:a00:1::", "private"],
    ["169.254.169.254", "link-local"],
    ["::ffff:169.254.169.254", "link-local"],
    ["::ffff:a9fe:a9fe", "link-local"],
    ["fe80::1", "link-local"],
    ["fe80::1%en0", "link-local"],
    ["100.64.0.1", "shared"],
    ["fd00::1", "unique-local"],
    ["fc00::1", "unique-local"],
    ["224.0.0.1", "multicast"],
    ["ff02::1", "multicast"],
    ["0.0.0.0", "reserved"],
    ["::", "reserved"],
    ["240.0.0.1", "reserved"],
    ["192.0.2.1", "reserved"],
    ["2001:db8::1", "reserved"],
    ["2001::1", "reserved"],
    ["not-an-ip", "reserved"],
  ])("%s is %s", (address, kind) => {
    expect(classifyAddress(address)).toBe(kind);
  });
});

describe("endpoint locality comes from the parsed host", () => {
  it.each([
    ["localhost", "local"],
    ["api.localhost", "local"],
    ["127.0.0.1", "local"],
    ["[::1]", "local"],
    ["192.168.1.10", "lan"],
    ["100.100.1.2", "lan"],
    ["gpu-box.local", "lan"],
    ["box.home.arpa", "lan"],
    ["api.openai.com", "cloud"],
    ["169.254.169.254", "cloud"],
  ])("%s is %s", (host, locality) => {
    expect(localityOfHost(host)).toBe(locality);
  });

  it("does not count a URL that merely contains localhost as local", () => {
    expect(endpointLocality("https://evil.test/localhost")).toBe("cloud");
    expect(endpointLocality("https://localhost.evil.test/")).toBe("cloud");
    expect(endpointLocality("https://evil.test/?u=127.0.0.1")).toBe("cloud");
    expect(endpointLocality("http://localhost:11434/v1")).toBe("local");
  });
});

describe("resolveAllowedTarget", () => {
  const resolve = resolverFor({
    "public.test": ["93.184.216.34"],
    "rebound.test": ["10.0.0.7"],
    "split.test": ["93.184.216.34", "127.0.0.1"],
    "metadata.test": ["169.254.169.254"],
    "v6-mapped.test": ["::ffff:7f00:1"],
  });

  it("allows a public host", async () => {
    const { addresses } = await resolveAllowedTarget(
      "https://public.test/page",
      "public",
      resolve,
    );
    expect(addresses).toEqual([{ address: "93.184.216.34", family: 4 }]);
  });

  it.each([
    ["http://169.254.169.254/latest/meta-data/", "metadata address"],
    ["http://metadata.test/", "name for the metadata address"],
    ["http://rebound.test/", "name that resolves to a private address"],
    ["http://split.test/", "name that also resolves to loopback"],
    ["http://v6-mapped.test/", "IPv4-mapped loopback"],
    ["http://[::ffff:127.0.0.1]/", "bracketed IPv6 loopback"],
    ["http://127.0.0.1:8080/", "loopback"],
    ["http://user:pass@public.test/", "credentials in the URL"],
    ["file:///etc/passwd", "a file URL"],
    ["ftp://public.test/", "another scheme"],
  ])("refuses %s (%s)", async (url) => {
    await expect(resolveAllowedTarget(url, "public", resolve)).rejects.toThrow(
      BlockedTargetError,
    );
  });
});

describe("model endpoints use the address check of their locality", () => {
  const resolve = resolverFor({
    localhost: ["127.0.0.1"],
    "api.cloud.test": ["10.1.2.3"],
    "evil.test": ["169.254.169.254"],
  });

  it("allows a local runner and a LAN address literal", async () => {
    await expect(
      assertModelEndpointAllowed("http://localhost:11434/v1", resolve),
    ).resolves.toBeUndefined();
    await expect(
      assertModelEndpointAllowed("http://192.168.1.20:8000/v1", resolve),
    ).resolves.toBeUndefined();
  });

  it("refuses a cloud name that resolves to a private address", async () => {
    await expect(
      assertModelEndpointAllowed("https://api.cloud.test/v1", resolve),
    ).rejects.toThrow(/private address/);
  });

  it("leaves a name that does not resolve to the call itself", async () => {
    await expect(
      assertModelEndpointAllowed("https://unknown.test/v1", resolve),
    ).resolves.toBeUndefined();
  });

  it("refuses metadata ranges for every row", async () => {
    await expect(
      assertModelEndpointAllowed("http://169.254.169.254/v1", resolve),
    ).rejects.toThrow(BlockedTargetError);
    await expect(
      assertModelEndpointAllowed("http://evil.test/v1", resolve),
    ).rejects.toThrow(/link-local/);
  });
});

describe("safeFetch redirects", () => {
  const resolve = resolverFor({
    "public.test": ["93.184.216.34"],
    "other.test": ["93.184.216.35"],
  });

  function fakeTransport(
    answers: Array<{ status: number; location?: string; body?: string }>,
  ) {
    const seen: string[] = [];
    const transport: SafeTransport = async (url, _addresses, options) => {
      seen.push(`${url.href} cookie=${options.headers.Cookie ?? "-"}`);
      const answer = answers.shift() ?? { status: 500 };
      return {
        status: answer.status,
        statusText: "",
        headers: answer.location ? { location: answer.location } : {},
        body: Buffer.from(answer.body ?? ""),
      };
    };
    return { transport, seen };
  }

  it("follows a redirect to another public host", async () => {
    const { transport, seen } = fakeTransport([
      { status: 302, location: "https://other.test/next" },
      { status: 200, body: "done" },
    ]);
    const res = await safeFetch("https://public.test/start", {
      resolve,
      transport,
      headers: { Cookie: "session=1" },
    });
    expect(await res.text()).toBe("done");
    expect(res.url).toBe("https://other.test/next");
    // No cookie is ever sent.
    expect(seen).toEqual([
      "https://public.test/start cookie=-",
      "https://other.test/next cookie=-",
    ]);
  });

  it("checks every hop and refuses a redirect into a private range", async () => {
    const { transport, seen } = fakeTransport([
      { status: 301, location: "http://10.0.0.1/admin" },
      { status: 200, body: "secret" },
    ]);
    await expect(
      safeFetch("https://public.test/start", { resolve, transport }),
    ).rejects.toThrow(BlockedTargetError);
    expect(seen).toHaveLength(1);
  });

  it("refuses a redirect to the metadata service", async () => {
    const { transport } = fakeTransport([
      { status: 307, location: "http://169.254.169.254/latest/meta-data/" },
    ]);
    await expect(
      safeFetch("https://public.test/", { resolve, transport }),
    ).rejects.toThrow(/link-local/);
  });

  it("stops after five redirects", async () => {
    const loop = Array.from({ length: 7 }, () => ({
      status: 302,
      location: "/again",
    }));
    const { transport, seen } = fakeTransport(loop);
    await expect(
      safeFetch("https://public.test/", { resolve, transport }),
    ).rejects.toThrow(/More than 5 redirects/);
    expect(seen).toHaveLength(6);
  });
});

describe("safeFetch over a real connection", () => {
  let server: Server | undefined;

  afterEach(async () => {
    await new Promise<void>((done) =>
      server ? server.close(() => done()) : done(),
    );
    server = undefined;
  });

  async function serve(
    handler: Parameters<typeof createServer>[1],
  ): Promise<number> {
    server = createServer(handler);
    await new Promise<void>((done) => server?.listen(0, "127.0.0.1", done));
    return (server?.address() as AddressInfo).port;
  }

  // The name exists only in the test resolver: the request can reach the
  // server only through the pinned address.
  const pinned = resolverFor({ "pinned.test": ["127.0.0.1"] });

  it("connects only to the checked address", async () => {
    const port = await serve((_req, res) => res.end("hello"));
    const res = await safeFetch(`http://pinned.test:${port}/`, {
      policy: "local",
      resolve: pinned,
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("hello");
  });

  it("refuses the same server under the public policy", async () => {
    const port = await serve((_req, res) => res.end("hello"));
    await expect(
      safeFetch(`http://pinned.test:${port}/`, { resolve: pinned }),
    ).rejects.toThrow(/loopback/);
  });

  it("decompresses and caps the body", async () => {
    const big = "x".repeat(5000);
    const port = await serve((_req, res) => {
      res.setHeader("content-encoding", "gzip");
      res.end(gzipSync(big));
    });
    const ok = await safeFetch(`http://pinned.test:${port}/`, {
      policy: "local",
      resolve: pinned,
    });
    expect(await ok.text()).toBe(big);
    await expect(
      safeFetch(`http://pinned.test:${port}/`, {
        policy: "local",
        resolve: pinned,
        maxBytes: 1000,
      }),
    ).rejects.toThrow(/exceeds 1000 bytes/);
  });

  it("gives up after its time limit", async () => {
    const port = await serve(() => {
      // Never answers.
    });
    await expect(
      safeFetch(`http://pinned.test:${port}/`, {
        policy: "local",
        resolve: pinned,
        timeoutMs: 200,
      }),
    ).rejects.toThrow(/timed out/);
  });
});

describe("source links go through the fetcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearReviewContextCache();
  });

  it("never fetches a metadata or private source link", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    for (const link of [
      "http://169.254.169.254/latest/meta-data/iam/",
      "http://10.0.0.1/admin",
      "http://[::1]:6379/",
    ]) {
      const context = await resolveReviewContext(link);
      expect(context?.content, link).toMatch(/Access denied/);
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
