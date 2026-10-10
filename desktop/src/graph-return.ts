/**
 * Where the 3D token graph should return (ADR 2026-10-10, Decision 3).
 *
 * The dashboard button and Lern-Karten both open `graph-view`. Back uses the
 * view that opened it. The default is the dashboard, which is also the
 * opener until something else asks.
 */

export type GraphOrigin = "dashboard-view" | "learning-content-view";

let origin: GraphOrigin = "dashboard-view";

export function rememberGraphOrigin(next: GraphOrigin): void {
  origin = next;
}

export function graphReturnOrigin(): GraphOrigin {
  return origin;
}
