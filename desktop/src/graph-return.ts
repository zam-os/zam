/**
 * Where the 3D token graph should return (ADR 2026-10-10, Decision 3).
 *
 * The sidebar entry and Lern-Karten both open `graph-view`. Back uses the
 * view that opened it; the sidebar counts as Lern-Karten while that page is
 * showing. The default is the dashboard (Today).
 */

export type GraphOrigin = "dashboard-view" | "learning-content-view";

let origin: GraphOrigin = "dashboard-view";

export function rememberGraphOrigin(next: GraphOrigin): void {
  origin = next;
}

export function graphReturnOrigin(): GraphOrigin {
  return origin;
}
