/**
 * ADR 2026-10-08b D2 at the outside: a model row's probe and its calls never
 * reach a link-local or metadata address, whatever URL a caller stored, and a
 * URL that only mentions localhost is not a local endpoint.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { probeModelCapabilities } from "../../src/cli/llm/capability-probe.js";
import {
  fetchWithInteractiveTimeout,
  isLlmOnline,
  isLocalEndpoint,
} from "../../src/cli/llm/client.js";

describe("model endpoints and the address check", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    "http://169.254.169.254/latest",
    "http://[fe80::1]:8080/v1",
    "http://[::ffff:169.254.169.254]/v1",
  ])("never probes %s", async (url) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await probeModelCapabilities({
      url,
      model: "any-model",
      apiFlavor: "chat-completions",
    });

    expect(result.reachable).toBe(false);
    expect(await isLlmOnline(url)).toBe(false);
    await expect(
      fetchWithInteractiveTimeout(`${url}/chat/completions`, {
        method: "POST",
        body: "{}",
      }),
    ).rejects.toThrow(/link-local/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("decides locality from the parsed host", () => {
    expect(isLocalEndpoint("http://localhost:11434/v1")).toBe(true);
    expect(isLocalEndpoint("http://127.0.0.1:8000/v1")).toBe(true);
    expect(isLocalEndpoint("http://[::1]:8000/v1")).toBe(true);
    expect(isLocalEndpoint("https://evil.test/localhost/v1")).toBe(false);
    expect(isLocalEndpoint("https://localhost.evil.test/v1")).toBe(false);
    expect(isLocalEndpoint("https://api.test/v1?via=127.0.0.1")).toBe(false);
  });
});
