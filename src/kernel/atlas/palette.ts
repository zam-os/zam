/**
 * The shared colour language of every knowledge view (ADR 2026-10-13,
 * Decision 4): hue says where, condition says how well.
 *
 * The hue comes from the subject a domain belongs to, so Mathematik is the
 * same blue in the learning graph, the atlas and every later view. The
 * condition from `condition.ts` washes, darkens or fogs that hue, and a
 * texture repeats it, so colour never carries the meaning alone.
 *
 * Values are ported from the knowledge-atlas spike (PR #405). Pure: no
 * database, no Node built-ins, no DOM. The Studio, the MCP Apps panels and
 * Mobile import it directly.
 */

import type { Condition } from "./condition.js";

/** Hue in degrees per subject key; the Weltwissen seed keeps the same keys. */
export const SUBJECT_HUES: Readonly<Record<string, number>> = Object.freeze({
  mathematik: 218,
  informatik: 250,
  physik: 188,
  chemie: 152,
  biologie: 100,
  geschichte: 36,
  geographie: 64,
  "politik-und-gesellschaft": 308,
  "wirtschaft-recht": 278,
  deutsch: 352,
  englisch: 16,
  franzoesisch: 328,
  latein: 302,
});

/** Raw first domain segments that belong to another subject. */
const SUBJECT_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  bwr: "wirtschaft-recht",
  pug: "politik-und-gesellschaft",
  wirtschaft: "wirtschaft-recht",
  recht: "wirtschaft-recht",
  wirtschaft_recht: "wirtschaft-recht",
  nut: "biologie",
});

/**
 * The key a domain path is coloured by: its first segment, through the
 * subject aliases. Older libraries still carry a leading `schule/`
 * (ADR 2026-10-05, Decision 7), which is skipped.
 */
export function hueKeyForDomain(domain: string): string {
  const segments = domain.trim().toLowerCase().split("/").filter(Boolean);
  if (segments[0] === "schule" && segments.length > 1) segments.shift();
  const raw = segments[0] ?? "";
  return SUBJECT_ALIASES[raw] ?? raw;
}

/** Hue in degrees for a key: the subject's own hue, else a stable hash. */
export function hueFor(key: string): number {
  const known = SUBJECT_HUES[key];
  if (known !== undefined) return known;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/** The texture that repeats a condition, for those who cannot tell the colours apart. */
export type ConditionTexture = "none" | "dust" | "cracks" | "fog" | "parchment";

export const CONDITION_TEXTURE: Readonly<Record<Condition, ConditionTexture>> =
  Object.freeze({
    known: "none",
    due: "dust",
    overdue: "dust",
    decaying: "cracks",
    forgotten: "fog",
    unpractised: "parchment",
  });

export type Rgb = readonly [number, number, number];

export type PaletteTheme = "light" | "dark";

const PARCHMENT: Readonly<Record<PaletteTheme, Rgb>> = Object.freeze({
  light: [244, 238, 222],
  dark: [52, 50, 44],
});

const FOG: Readonly<Record<PaletteTheme, Rgb>> = Object.freeze({
  light: [238, 242, 246],
  dark: [128, 140, 154],
});

/**
 * How a region below the colour level sets itself apart from its siblings:
 * a hue shift and a lightness (light theme), so neighbouring Gebiete of one
 * Fach read as one family in different shades.
 */
export interface Shade {
  hueShift: number;
  lightness: number;
}

/** The plain shade: the subject hue at its own lightness. */
export const BASE_SHADE: Shade = Object.freeze({ hueShift: 0, lightness: 55 });

const SHADE_SHIFT = [0, 16, -16, 30, -30, 8, -8, 22];
const SHADE_LIGHT = [55, 66, 47, 72, 42, 61, 51, 68];

/**
 * The shade of the `index`-th region below the colour level. `leafIndex`, the
 * place of a deeper leaf among its siblings, adds a small step, so a Thema
 * differs a little from the next Thema of the same Gebiet.
 */
export function regionShade(index: number, leafIndex: number | null): Shade {
  const i = Math.max(0, index) % SHADE_SHIFT.length;
  if (leafIndex === null) {
    return { hueShift: SHADE_SHIFT[i], lightness: SHADE_LIGHT[i] };
  }
  const li = Math.max(0, leafIndex);
  return {
    hueShift: SHADE_SHIFT[i] + ((li % 3) - 1) * 4,
    lightness: SHADE_LIGHT[i] + (li % 2 ? 4 : -2),
  };
}

/**
 * Fill colour of a unit at this hue in this condition. `null` means the
 * learner holds no card for it: barely tinted parchment. `shade` sets a
 * region apart from its siblings (`regionShade`).
 */
export function conditionFill(
  hue: number,
  condition: Condition | null,
  theme: PaletteTheme,
  shade: Shade = BASE_SHADE,
): Rgb {
  const dark = theme === "dark";
  const saturation = dark ? 48 : 62;
  const lightness = dark ? shade.lightness * 0.72 : shade.lightness;
  hue += shade.hueShift;
  const base = hslToRgb(hue, saturation, lightness);
  switch (condition) {
    case "known":
      return base;
    case "due":
      return hslToRgb(hue, saturation * 0.5, lightness + (dark ? 2 : 7));
    case "overdue":
      return hslToRgb(hue, saturation * 0.6, lightness * 0.7);
    case "decaying":
      return hslToRgb(hue - 10, saturation * 0.4, lightness * 0.56);
    case "forgotten":
      return mix(base, FOG[theme], 0.72);
    case "unpractised":
      return mix(PARCHMENT[theme], base, 0.26);
    case null:
      return mix(PARCHMENT[theme], base, 0.1);
  }
}

/** `rgb(…)`, or `rgba(…)` with an alpha below 1. */
export function rgbCss(rgb: Rgb, alpha = 1): string {
  const [r, g, b] = rgb.map((v) => Math.round(v));
  return alpha < 1
    ? `rgba(${r}, ${g}, ${b}, ${alpha})`
    : `rgb(${r}, ${g}, ${b})`;
}

/** Hue in degrees, saturation and lightness in percent. */
export function hslToRgb(
  hue: number,
  saturation: number,
  lightness: number,
): Rgb {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = Math.max(0, Math.min(100, saturation)) / 100;
  const l = Math.max(0, Math.min(100, lightness)) / 100;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

/** `a` moved towards `b` by `t` (0 = a, 1 = b). */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}
