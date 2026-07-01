import { describe, expect, it } from "vitest";
import { isSafeUrl, cleanHtml, readLocalFile } from "../../src/cli/adapters/source-reader.js";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";

describe("source-reader utilities", () => {
  it("rejects local and loopback URLs for security safety", async () => {
    expect(await isSafeUrl("http://localhost")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.1")).toBe(false);
    expect(await isSafeUrl("http://192.168.1.1")).toBe(false);
    expect(await isSafeUrl("http://10.0.0.1")).toBe(false);
    expect(await isSafeUrl("http://172.16.0.1")).toBe(false);
    expect(await isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("accepts safe public internet URLs", async () => {
    expect(await isSafeUrl("https://example.com")).toBe(true);
    expect(await isSafeUrl("http://8.8.8.8")).toBe(true);
  });

  it("sanitizes HTML into clean plain text", () => {
    const rawHtml = "<html><head><title>Ignore</title></head><body><h1>Hello</h1><script>console.log('bad')</script><p>World</p></body></html>";
    const cleaned = cleanHtml(rawHtml);
    expect(cleaned).toBe("Hello World");
  });

  it("reads local plain text or markdown files within size limit", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "zam-reader-"));
    const tempFile = join(tempDir, "test.md");
    writeFileSync(tempFile, "# Hello Zam Markdown");

    try {
      const content = await readLocalFile(tempFile);
      expect(content).toBe("# Hello Zam Markdown");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
