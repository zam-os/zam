/**
 * Showing and hiding self-built dialog parts.
 *
 * The `hidden` attribute alone loses to an inline `display`, and the
 * material-import dialogs lay their sections out with inline flex: a section
 * set `hidden` stayed on screen. Elements remember the display they were
 * built with in `data-display`, and showing one restores it.
 */
export function setShown(node: HTMLElement, shown: boolean): void {
  node.hidden = !shown;
  node.style.display = shown ? (node.dataset.display ?? "") : "none";
}

/** Record an inline display so {@link setShown} can bring it back. */
export function rememberDisplay(node: HTMLElement): void {
  if (node.style.display && node.style.display !== "none") {
    node.dataset.display = node.style.display;
  }
}
