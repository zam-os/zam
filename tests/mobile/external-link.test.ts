import { describe, expect, it, vi } from "vitest";
import {
  openExternalLink,
  wireExternalLink,
} from "../../mobile/src/external-link.js";

const LESSON =
  "https://academy.zam-os.org/mathematik-realschule-9/#lesson=rd-1";

// The iOS web view ignored target="_blank": the lesson never opened (review
// of zam-os/zam#471). Every Mobile web link goes through the opener plugin.
describe("Mobile external links", () => {
  it("opens an http(s) URL through the opener", async () => {
    const opener = vi.fn(async () => {});
    const fallback = vi.fn();
    await openExternalLink(LESSON, opener, fallback);
    expect(opener).toHaveBeenCalledWith(LESSON);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("opens nothing that is not http(s)", async () => {
    const opener = vi.fn(async () => {});
    const fallback = vi.fn();
    for (const href of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "zam://pair",
      "not a url",
    ]) {
      await openExternalLink(href, opener, fallback);
    }
    expect(opener).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back to a browser tab without the Tauri runtime", async () => {
    const fallback = vi.fn();
    await openExternalLink(
      LESSON,
      async () => {
        throw new Error("no __TAURI_INTERNALS__");
      },
      fallback,
    );
    expect(fallback).toHaveBeenCalledWith(LESSON);
  });

  it("keeps the web view from following a wired link itself", async () => {
    let onClick: ((event: { preventDefault(): void }) => void) | undefined;
    const anchor = {
      href: LESSON,
      addEventListener: (type: string, listener: typeof onClick) => {
        if (type === "click") onClick = listener;
      },
    } as unknown as HTMLAnchorElement;
    const opener = vi.fn(async () => {});
    wireExternalLink(anchor, opener);
    const preventDefault = vi.fn();
    onClick?.({ preventDefault });
    await Promise.resolve();
    expect(preventDefault).toHaveBeenCalled();
    expect(opener).toHaveBeenCalledWith(LESSON);
  });
});
