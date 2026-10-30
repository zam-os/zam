/**
 * Web links that leave the app: a card's source, an Academy lesson, a
 * provider's key page. The iOS and Android web views ignore
 * `target="_blank"`, so a tap goes through the opener plugin (scoped to
 * http and https in `capabilities/opener.json`). A plain browser, as in
 * development, opens a tab instead.
 */

export type UrlOpener = (url: string) => Promise<void>;

/** Open an http(s) URL outside the app; anything else is ignored. */
export async function openExternalLink(
  href: string,
  opener: UrlOpener,
  fallback: (url: string) => void = (url) => {
    window.open(url, "_blank", "noreferrer");
  },
): Promise<void> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  try {
    await opener(url.href);
  } catch {
    // No Tauri runtime: the development browser opens the tab itself.
    fallback(url.href);
  }
}

/** Route a link's taps through the opener; its href stays the target. */
export function wireExternalLink(
  anchor: HTMLAnchorElement,
  opener: UrlOpener,
): void {
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    void openExternalLink(anchor.href, opener);
  });
}
