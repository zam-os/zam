/**
 * The Studio's 3D Wissensnetz is an alpha now: the knowledge atlas took its
 * place in the sidebar and on Lern-Karten (ADR 2026-10-13, owner decision).
 * A machine-local switch brings it back. Only the Studio's own Settings
 * write it; the command is not on the Studio panel bridge.
 */

import {
  getGraph3dConfig,
  setGraph3dConfig,
} from "../kernel/system/install-config.js";

export function graph3dFeature(opts: { enable?: boolean; disable?: boolean }): {
  success: true;
  enabled: boolean;
} {
  if (opts.enable && opts.disable) {
    throw new Error("Pass either --enable or --disable, not both.");
  }
  if (opts.enable || opts.disable) {
    setGraph3dConfig({ enabled: Boolean(opts.enable) });
  }
  return { success: true, enabled: getGraph3dConfig().enabled === true };
}
