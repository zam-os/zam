/**
 * The contract between the knowledge-map shell and its swappable views
 * (ADR 2026-10-03, Decision 2).
 *
 * A view only reads the map index and reports clicks through its host. It
 * never calls the bridge and imports nothing from Tauri, main.ts or the MCP
 * panels, so the Studio and the standalone prototype run the same modules.
 */

import type { MapIndex } from "../../../src/cli/knowledge-map/model.js";

export interface ViewHost {
  /** Ask the shell to move the focus; the shell then calls `setFocus`. */
  navigate(id: string): void;
  t(key: string): string;
  tf(key: string, values: Record<string, string | number>): string;
}

export interface FocusChange {
  /** The statement that was in focus before, if any. */
  previous: string | null;
}

export interface KnowledgeMapView {
  /** An overview the shell shows beside the view (overview+detail). */
  overview?: HTMLElement;
  setFocus(id: string, change: FocusChange): void;
  /** Re-measure after the container changed size. */
  resize?(): void;
  destroy(): void;
}

export type ViewFactory = (
  container: HTMLElement,
  index: MapIndex,
  host: ViewHost,
  initialFocus: string,
) => KnowledgeMapView;

export interface ViewModule {
  createView: ViewFactory;
}
