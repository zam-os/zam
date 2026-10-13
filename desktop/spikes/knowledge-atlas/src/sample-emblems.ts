/**
 * Sinnbilder for the upper levels of the atlas — Bereiche, Fächer and
 * Gebiete — keyed by taxonomy key. Drawn by a text-only model (Claude, in
 * the session that built this spike): SVG is text. Each one passes
 * `validateEmblemSvg`. Begriffe reuse the 3D spike's Mathe Sinnbilder.
 */
import type { Emblem } from "./atlas.ts";

const S = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
const INK = "#1d2b4f";
const OR = "#e8590c";
const BL = "#2f6fdf";
const GR = "#2f9e44";
const YE = "#f2b705";
const RD = "#d6336c";
const PU = "#7048e8";
const BR = "#a0522d";
const GY = "#868e96";

const t = (x: number, y: number, size: number, color: string, text: string, weight = 700) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle">${text}</text>`;
const ln = (x1: number, y1: number, x2: number, y2: number, color = INK, w = 3) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
const c = (cx: number, cy: number, r: number, fill = "none", stroke = INK, w = 3, opacity = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${w}"/>`;
const p = (d: string, fill = "none", stroke = INK, w = 3, opacity = 1) =>
  `<path d="${d}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const rect = (x: number, y: number, w: number, h: number, rx = 0, fill = "none", stroke = INK, sw = 3, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"/>`;
const poly = (points: string, fill = "none", stroke = INK, w = 3, opacity = 1) =>
  `<polygon points="${points}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill = "none", stroke = INK, w = 3, opacity = 1, rotate = 0) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${w}"${rotate ? ` transform="rotate(${rotate} ${cx} ${cy})"` : ""}/>`;
const arrow = (x1: number, y1: number, x2: number, y2: number, color = INK, w = 3) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = (da: number) => `${(x2 - 7 * Math.cos(a + da)).toFixed(1)} ${(y2 - 7 * Math.sin(a + da)).toFixed(1)}`;
  return ln(x1, y1, x2, y2, color, w) + p(`M${h(0.5)} L${x2} ${y2} L${h(-0.5)}`, "none", color, w);
};

export const REGION_EMBLEMS: Record<string, Partial<Emblem>> = {
  // ── Bereiche ─────────────────────────────────────────────────────────────
  logik: {
    glyph: "π",
    svg: S(`${p("M18 10 Q11 10 11 18 L11 27 Q11 32 6 32 Q11 32 11 37 L11 46 Q11 54 18 54")}${p("M46 10 Q53 10 53 18 L53 27 Q53 32 58 32 Q53 32 53 37 L53 46 Q53 54 46 54")}${t(32, 45, 34, BL, "π")}`),
  },
  natur: {
    svg: S(`${c(44, 18, 8, YE, OR, 2)}${p("M4 50 L22 24 L32 38 L40 30 L60 50 Z", GR, INK, 3, 0.35)}${p("M4 57 Q12 53 20 57 T36 57 T52 57 T60 57", "none", BL, 3)}`),
  },
  gesellschaft: {
    svg: S(`${c(17, 24, 6)}${p("M6 52 Q6 36 17 36 Q28 36 28 52")}${c(47, 24, 6)}${p("M36 52 Q36 36 47 36 Q58 36 58 52")}${c(32, 19, 7, OR, INK, 3, 0.35)}${p("M19 56 Q19 34 32 34 Q45 34 45 56", OR, INK, 3, 0.35)}`),
  },
  sprache: {
    svg: S(`${rect(5, 8, 36, 24, 8, "#ffffff")}${p("M14 32 L12 40 L22 32")}${t(23, 26, 13, INK, "Aa")}${rect(23, 30, 36, 22, 8, BL, INK, 3, 0.25)}${p("M50 52 L52 59 L42 52")}${t(41, 46, 13, OR, "…")}`),
  },

  // ── Fächer ───────────────────────────────────────────────────────────────
  mathematik: {
    glyph: "+ − × ÷",
    svg: S(`${rect(8, 8, 48, 48, 10, BL, INK, 3, 0.12)}${ln(32, 10, 32, 54, INK, 2)}${ln(10, 32, 54, 32, INK, 2)}${t(20, 27, 18, INK, "+")}${t(44, 27, 18, OR, "−")}${t(20, 51, 18, OR, "×")}${t(44, 51, 18, INK, "÷")}`),
  },
  informatik: {
    glyph: "01",
    svg: S(`${rect(7, 9, 50, 33, 4, PU, INK, 3, 0.12)}${t(32, 32, 16, PU, "0101")}${ln(32, 42, 32, 51)}${ln(21, 53, 43, 53)}`),
  },
  physik: {
    glyph: "F = m·a",
    svg: S(`${ln(10, 8, 54, 8)}${ln(32, 8, 44, 42, INK, 2)}${c(45, 46, 7, OR, INK, 3)}${p("M16 42 Q32 56 48 42", "none", GY, 2)}${c(32, 8, 2, INK)}`),
  },
  chemie: {
    glyph: "H₂O",
    svg: S(`${p("M17 44 L47 44 L52 52 Q54 56 49 56 L15 56 Q10 56 12 52 Z", GR, "none", 0, 0.45)}${p("M26 8 L26 26 L12 52 Q10 56 15 56 L49 56 Q54 56 52 52 L38 26 L38 8")}${ln(22, 8, 42, 8)}${c(30, 37, 2.5, "none", GR, 2)}${c(36, 31, 2, "none", GR, 2)}`),
  },
  biologie: {
    svg: S(`${ell(32, 32, 27, 20, GR, INK, 3, 0.18)}${c(37, 30, 8, GR, INK, 2, 0.5)}${c(37, 30, 2.5, INK, "none", 0)}${c(17, 25, 2.5, OR, "none", 0)}${c(21, 41, 2.5, OR, "none", 0)}${c(48, 43, 2.5, OR, "none", 0)}`),
  },
  geschichte: {
    glyph: "⌛",
    svg: S(`${ln(16, 7, 48, 7)}${ln(16, 57, 48, 57)}${p("M25 14 L39 14 Q36 24 32 27 Q28 24 25 14 Z", OR, "none", 0, 0.45)}${p("M23 53 Q32 42 41 53 Z", OR, "none", 0, 0.8)}${p("M20 7 Q20 26 32 32 Q20 38 20 57")}${p("M44 7 Q44 26 32 32 Q44 38 44 57")}`),
  },
  geographie: {
    svg: S(`${c(32, 32, 24, BL, INK, 3, 0.15)}${ell(32, 32, 10, 24)}${ln(8, 32, 56, 32, INK, 2)}${p("M12 20 Q32 26 52 20", "none", INK, 2)}${p("M12 44 Q32 38 52 44", "none", INK, 2)}${p("M20 14 Q26 22 22 30 Q30 34 28 42", "none", GR, 4)}`),
  },
  "wirtschaft-recht": {
    glyph: "§ €",
    svg: S(`${ln(32, 12, 32, 54)}${ln(20, 55, 44, 55)}${ln(10, 18, 54, 18)}${c(32, 11, 3, INK)}${ln(10, 18, 5, 34, INK, 2)}${ln(10, 18, 15, 34, INK, 2)}${p("M3 34 Q10 42 17 34 Z", YE, INK, 2, 0.6)}${ln(54, 18, 49, 34, INK, 2)}${ln(54, 18, 59, 34, INK, 2)}${p("M47 34 Q54 42 61 34 Z", YE, INK, 2, 0.6)}`),
  },
  deutsch: {
    glyph: "Ä",
    svg: S(`${p("M32 16 Q20 10 7 14 L7 51 Q20 47 32 53 Q44 47 57 51 L57 14 Q44 10 32 16 Z", RD, INK, 3, 0.12)}${ln(32, 16, 32, 52, INK, 2)}${t(20, 39, 17, RD, "Ä")}${ln(38, 25, 51, 23, INK, 2)}${ln(38, 32, 51, 30, INK, 2)}${ln(38, 39, 51, 37, INK, 2)}`),
  },
  englisch: {
    glyph: "Hi!",
    svg: S(`${rect(6, 10, 52, 34, 10, OR, INK, 3, 0.15)}${p("M18 44 L14 56 L29 44")}${t(32, 35, 20, OR, "Hi!")}`),
  },
  franzoesisch: {
    glyph: "é",
    svg: S(`${p("M32 5 L21 57 M32 5 L43 57")}${ln(24, 44, 40, 44, INK, 2)}${ln(27, 29, 37, 29, INK, 2)}${p("M22 57 Q32 46 42 57", "none", RD, 3)}${ln(32, 5, 32, 2, INK, 2)}`),
  },
  latein: {
    glyph: "SPQR",
    svg: S(`${rect(6, 18, 52, 28, 3, YE, INK, 3, 0.25)}${t(32, 38, 15, BR, "SPQR")}${p("M10 52 Q32 62 54 52", "none", GR, 3)}`),
  },

  // ── Gebiete: Mathematik ──────────────────────────────────────────────────
  "mathematik/zahlen": {
    glyph: "½",
    svg: S(`${ln(6, 42, 56, 42)}${p("M52 38 L57 42 L52 46")}${ln(14, 37, 14, 47, INK, 2)}${ln(26, 37, 26, 47, INK, 2)}${ln(38, 37, 38, 47, INK, 2)}${ln(50, 37, 50, 47, INK, 2)}${c(32, 42, 3.5, OR, "none", 0)}${t(32, 28, 20, BL, "½")}`),
  },
  "mathematik/algebra": {
    glyph: "2x + 1",
    svg: S(`${rect(7, 18, 22, 26, 4, BL, INK, 3, 0.2)}${t(18, 38, 20, BL, "x")}${t(45, 38, 17, INK, "= 7")}`),
  },
  "mathematik/funktionen": {
    glyph: "f(x)",
    svg: S(`${ln(6, 48, 58, 48, INK, 2)}${ln(32, 58, 32, 6, INK, 2)}${p("M14 10 Q32 80 50 10", "none", BL, 3)}${p("M8 58 L56 18", "none", OR, 3)}`),
  },
  "mathematik/geometrie": {
    glyph: "△",
    svg: S(`${poly("9,53 55,53 21,13", BL, INK, 3, 0.15)}${c(42, 24, 10, "none", OR, 3)}`),
  },
  "mathematik/stochastik": {
    glyph: "P(A)",
    svg: S(`${rect(7, 12, 30, 30, 6, "#ffffff")}${c(15, 20, 2.6, INK, "none", 0)}${c(22, 27, 2.6, INK, "none", 0)}${c(29, 34, 2.6, INK, "none", 0)}${rect(42, 36, 6, 18, 1, OR, "none", 0)}${rect(51, 24, 6, 30, 1, BL, "none", 0)}${ln(40, 55, 59, 55, INK, 2)}`),
  },
  "mathematik/vektoren": {
    glyph: "v⃗",
    svg: S(`${arrow(10, 54, 52, 54, OR)}${arrow(10, 54, 10, 12, BL)}${arrow(10, 54, 48, 18, INK)}`),
  },

  // ── Gebiete: Informatik ──────────────────────────────────────────────────
  "informatik/information": {
    glyph: "1011",
    svg: S(
      [0, 1, 2, 3]
        .flatMap((row) => [0, 1, 2, 3].map((col) => rect(10 + col * 11, 10 + row * 11, 10, 10, 1, (row * 3 + col) % 3 === 0 ? PU : "#ffffff", INK, 1.5, (row * 3 + col) % 3 === 0 ? 0.8 : 1)))
        .join(""),
    ),
  },
  "informatik/modellierung": {
    svg: S(`${rect(6, 8, 28, 22, 2, PU, INK, 3, 0.15)}${ln(6, 16, 34, 16, INK, 2)}${rect(30, 38, 28, 20, 2, "#ffffff")}${ln(30, 46, 58, 46, INK, 2)}${p("M20 30 L20 48 L30 48", "none", INK, 2)}`),
  },
  "informatik/algorithmen": {
    glyph: "O(n)",
    svg: S(`${[10, 18, 26, 34, 42].map((h, i) => rect(7 + i * 10, 54 - h, 8, h, 1, i % 2 ? PU : BL, "none", 0, 0.75)).join("")}${ln(5, 55, 59, 55, INK, 2)}`),
  },
  "informatik/datenbanken": {
    glyph: "SQL",
    svg: S(`${ell(32, 14, 20, 6, PU, INK, 3, 0.2)}${ln(12, 14, 12, 50)}${ln(52, 14, 52, 50)}${p("M12 50 A20 6 0 0 0 52 50")}${p("M12 26 A20 6 0 0 0 52 26", "none", INK, 2)}${p("M12 38 A20 6 0 0 0 52 38", "none", INK, 2)}`),
  },
  "informatik/netze": {
    svg: S(`${ln(14, 16, 32, 34, INK, 2)}${ln(50, 14, 32, 34, INK, 2)}${ln(12, 52, 32, 34, INK, 2)}${ln(52, 50, 32, 34, INK, 2)}${ln(14, 16, 50, 14, INK, 2)}${ln(12, 52, 52, 50, INK, 2)}${c(14, 16, 5, "#ffffff")}${c(50, 14, 5, "#ffffff")}${c(32, 34, 6, PU, INK, 3, 0.8)}${c(12, 52, 5, "#ffffff")}${c(52, 50, 5, "#ffffff")}`),
  },

  // ── Gebiete: Physik ──────────────────────────────────────────────────────
  "physik/mechanik": {
    glyph: "F",
    svg: S(`${poly("6,56 58,56 58,22", BL, INK, 3, 0.12)}${rect(26, 30, 15, 11, 1, OR, INK, 2)}`.replace(`<rect x="26"`, `<rect transform="rotate(-33 33 35)" x="26"`) + arrow(33, 40, 33, 58, RD, 3)),
  },
  "physik/waerme": {
    glyph: "°C",
    svg: S(`${rect(25, 5, 14, 42, 7, "#ffffff")}${c(32, 50, 9, RD, INK, 3)}${ln(32, 46, 32, 20, RD, 5)}${ln(42, 14, 48, 14, INK, 2)}${ln(42, 22, 48, 22, INK, 2)}${ln(42, 30, 48, 30, INK, 2)}`),
  },
  "physik/elektrizitaet": {
    glyph: "U = R·I",
    svg: S(`${c(32, 24, 16, YE, INK, 3, 0.45)}${rect(24, 40, 16, 12, 2, GY, INK, 3, 0.4)}${p("M25 29 L29 21 L33 29 L37 21 L39 26", "none", OR, 2)}${ln(6, 22, 11, 22, OR, 2)}${ln(53, 22, 58, 22, OR, 2)}${ln(12, 6, 16, 10, OR, 2)}${ln(52, 6, 48, 10, OR, 2)}`),
  },
  "physik/optik": {
    glyph: "f",
    svg: S(`${p("M4 16 L32 16 L54 32", "none", OR, 2)}${p("M4 48 L32 48 L54 32", "none", OR, 2)}${ell(32, 32, 6, 24, BL, INK, 3, 0.25)}${c(54, 32, 3, INK, "none", 0)}${ln(2, 32, 62, 32, GY, 1.5)}`),
  },
  "physik/atome": {
    glyph: "⚛",
    svg: S(`${ell(32, 32, 27, 9, "none", BL, 2.5)}${ell(32, 32, 27, 9, "none", BL, 2.5, 1, 60)}${ell(32, 32, 27, 9, "none", BL, 2.5, 1, 120)}${c(32, 32, 5, OR, INK, 2)}`),
  },
  "physik/kosmos": {
    glyph: "★",
    svg: S(`${c(30, 34, 14, PU, INK, 3, 0.3)}${ell(30, 34, 25, 6, "none", OR, 3, 1, -20)}${c(53, 10, 2, YE, "none", 0)}${c(10, 12, 1.6, INK, "none", 0)}${c(56, 52, 1.6, INK, "none", 0)}${c(44, 6, 1.2, INK, "none", 0)}`),
  },

  // ── Gebiete: Chemie ──────────────────────────────────────────────────────
  "chemie/teilchen": {
    glyph: "H",
    svg: S(`${rect(12, 8, 40, 48, 4, GR, INK, 3, 0.15)}${t(20, 20, 9, INK, "1")}${t(32, 44, 26, GR, "H")}`),
  },
  "chemie/reaktionen": {
    glyph: "A + B → AB",
    svg: S(`${c(10, 32, 6, BL, INK, 2, 0.6)}${c(25, 32, 6, OR, INK, 2, 0.6)}${arrow(33, 32, 44, 32, INK, 2.5)}${c(50, 26, 6, BL, INK, 2, 0.6)}${c(54, 38, 6, OR, INK, 2, 0.6)}`),
  },
  "chemie/organik": {
    glyph: "C₆H₆",
    svg: S(`${poly("32,10 51,21 51,43 32,54 13,43 13,21", GR, INK, 3, 0.15)}${c(32, 32, 12, "none", INK, 2)}`),
  },
  "chemie/biochemie": {
    svg: S(`${p("M9 41 L21 29 L33 38 L45 27 L55 36", "none", INK, 2)}${c(9, 41, 6, GR, INK, 2, 0.7)}${c(21, 29, 6, OR, INK, 2, 0.7)}${c(33, 38, 6, BL, INK, 2, 0.7)}${c(45, 27, 6, GR, INK, 2, 0.7)}${c(55, 36, 6, OR, INK, 2, 0.7)}`),
  },
  "chemie/analytik": {
    glyph: "pH",
    svg: S(`${p("M24 34 L40 34 L40 48 Q40 58 32 58 Q24 58 24 48 Z", PU, "none", 0, 0.45)}${p("M24 6 L24 48 Q24 58 32 58 Q40 58 40 48 L40 6")}${ln(20, 6, 44, 6)}${ln(46, 20, 58, 20, RD, 4)}${ln(46, 28, 58, 28, YE, 4)}${ln(46, 36, 58, 36, GR, 4)}`),
  },

  // ── Gebiete: Biologie ────────────────────────────────────────────────────
  "biologie/forschen": {
    svg: S(`${c(26, 26, 17, BL, INK, 3, 0.1)}${ell(26, 26, 9, 5, GR, INK, 2, 0.5)}${c(28, 26, 2, INK, "none", 0)}${ln(39, 39, 56, 56, INK, 6)}`),
  },
  "biologie/pflanzen": {
    glyph: "✿",
    svg: S(`${ln(32, 32, 32, 58, GR, 3)}${ell(42, 48, 9, 4, GR, GR, 1, 0.8, -30)}${[-90, -18, 54, 126, 198].map((a) => c(32 + 9 * Math.cos((a * Math.PI) / 180), 21 + 9 * Math.sin((a * Math.PI) / 180), 7, OR, INK, 2, 0.45)).join("")}${c(32, 21, 5, YE, INK, 2)}`),
  },
  "biologie/tiere": {
    svg: S(`${ell(32, 43, 13, 11, BR, INK, 2, 0.75)}${ell(15, 27, 5, 6.5, BR, INK, 2, 0.75)}${ell(25, 17, 5, 6.5, BR, INK, 2, 0.75)}${ell(39, 17, 5, 6.5, BR, INK, 2, 0.75)}${ell(49, 27, 5, 6.5, BR, INK, 2, 0.75)}`),
  },
  "biologie/mensch": {
    glyph: "♥",
    svg: S(`${p("M32 55 C10 41 5 27 13 18 C21 10 30 13 32 22 C34 13 43 10 51 18 C59 27 54 41 32 55 Z", RD, INK, 3, 0.3)}${p("M9 34 L21 34 L25 26 L31 42 L36 29 L40 34 L55 34", "none", INK, 2)}`),
  },
  "biologie/nerven": {
    svg: S(`${ln(24, 30, 8, 14, INK, 2)}${ln(24, 30, 5, 33, INK, 2)}${ln(24, 30, 13, 49, INK, 2)}${ln(24, 30, 22, 9, INK, 2)}${p("M33 32 Q45 34 54 46", "none", INK, 3)}${ln(54, 46, 60, 41, INK, 2)}${ln(54, 46, 57, 55, INK, 2)}${c(24, 30, 9, YE, INK, 3, 0.6)}${c(24, 30, 3, OR, "none", 0)}`),
  },
  "biologie/genetik": {
    glyph: "DNA",
    svg: S(`${ln(18, 11, 46, 11, OR, 2)}${ln(18, 25, 46, 25, BL, 2)}${ln(18, 39, 46, 39, OR, 2)}${ln(18, 53, 46, 53, BL, 2)}${p("M32 4 Q60 11 32 18 Q4 25 32 32 Q60 39 32 46 Q4 53 32 60", "none", GR, 3)}${p("M32 4 Q4 11 32 18 Q60 25 32 32 Q4 39 32 46 Q60 53 32 60", "none", INK, 3)}`),
  },
  "biologie/evolution": {
    svg: S(`${p("M32 58 L32 36 M32 46 L18 30 M32 40 L46 24 M18 30 L12 18 M18 30 L25 16 M46 24 L40 10 M46 24 L55 14", "none", BR, 3)}${c(12, 16, 4, GR, "none", 0)}${c(25, 14, 4, GR, "none", 0)}${c(40, 8, 4, GR, "none", 0)}${c(55, 12, 4, GR, "none", 0)}${c(32, 34, 4, GR, "none", 0)}`),
  },

  // ── Gebiete: Geschichte ──────────────────────────────────────────────────
  "geschichte/anfaenge": {
    svg: S(`${poly("32,6 47,30 40,56 24,56 17,30", BR, INK, 3, 0.35)}${p("M32 6 L30 30 L24 56 M30 30 L47 30 M30 30 L40 56", "none", INK, 1.5)}`),
  },
  "geschichte/antike": {
    svg: S(`${rect(11, 8, 42, 6, 1, YE, INK, 3, 0.4)}${c(15, 18, 3)}${c(49, 18, 3)}${rect(18, 18, 28, 32, 0, "#ffffff")}${ln(25, 20, 25, 48, INK, 2)}${ln(32, 20, 32, 48, INK, 2)}${ln(39, 20, 39, 48, INK, 2)}${rect(11, 50, 42, 6, 1, YE, INK, 3, 0.4)}`),
  },
  "geschichte/mittelalter": {
    svg: S(`${p("M14 58 L14 20 L20 20 L20 14 L26 14 L26 20 L32 20 L32 14 L38 14 L38 20 L44 20 L44 14 L50 14 L50 58 Z", GY, INK, 3, 0.25)}${p("M26 58 L26 47 Q32 39 38 47 L38 58", BR, INK, 2, 0.7)}${rect(29, 26, 6, 8, 1, INK, "none", 0)}${ln(32, 14, 32, 4, INK, 2)}${poly("32,4 44,7 32,10", RD, "none", 0)}`),
  },
  "geschichte/neuzeit": {
    svg: S(`${p("M8 42 L56 42 L48 53 L16 53 Z", BR, INK, 3, 0.5)}${ln(32, 42, 32, 6)}${poly("34,9 52,34 34,34", "#ffffff", INK, 2)}${poly("30,12 30,34 15,34", OR, INK, 2, 0.4)}${p("M4 59 Q12 55 20 59 T36 59 T52 59 T60 59", "none", BL, 3)}`),
  },
  "geschichte/kaiserreich": {
    glyph: "♛",
    svg: S(`${p("M10 46 L8 16 L22 31 L32 10 L42 31 L56 16 L54 46 Z", YE, INK, 3, 0.5)}${rect(9, 46, 46, 8, 2, YE, INK, 3, 0.8)}${c(32, 38, 3.5, RD, "none", 0)}${c(20, 39, 2.5, BL, "none", 0)}${c(44, 39, 2.5, BL, "none", 0)}`),
  },
  "geschichte/zeitgeschichte": {
    glyph: "1989",
    svg: S(`${rect(6, 16, 52, 40, 1, GY, INK, 3, 0.2)}${ln(6, 26, 58, 26, INK, 2)}${ln(6, 36, 58, 36, INK, 2)}${ln(6, 46, 58, 46, INK, 2)}${ln(18, 16, 18, 26, INK, 2)}${ln(42, 16, 42, 26, INK, 2)}${ln(12, 26, 12, 36, INK, 2)}${ln(50, 26, 50, 36, INK, 2)}${ln(20, 36, 20, 46, INK, 2)}${ln(44, 36, 44, 46, INK, 2)}${ln(14, 46, 14, 56, INK, 2)}${ln(50, 46, 50, 56, INK, 2)}${p("M30 16 L36 29 L27 40 L34 56", "none", RD, 3)}`),
  },

  // ── Gebiete: Geographie ──────────────────────────────────────────────────
  "geographie/erde": {
    glyph: "N",
    svg: S(`${c(32, 32, 24, BL, INK, 2, 0.1)}${poly("32,6 37,32 27,32", RD, "none", 0)}${poly("32,58 37,32 27,32", INK, "none", 0)}${poly("6,32 32,27 32,37", "#ffffff", INK, 1.5)}${poly("58,32 32,27 32,37", "#ffffff", INK, 1.5)}${c(32, 32, 2.5, "#ffffff", INK, 1.5)}`),
  },
  "geographie/klima": {
    glyph: "☀",
    svg: S(`${c(20, 19, 9, YE, OR, 2)}${p("M18 44 Q11 44 11 38 Q11 31 20 32 Q22 24 32 25 Q42 24 44 32 Q53 32 53 39 Q53 46 45 46 Z", "#ffffff", INK, 3)}${ln(22, 51, 20, 57, BL, 2.5)}${ln(32, 51, 30, 57, BL, 2.5)}${ln(42, 51, 40, 57, BL, 2.5)}`),
  },
  "geographie/raeume": {
    svg: S(`${poly("6,20 24,14 40,20 58,14 58,54 40,60 24,54 6,60", GR, INK, 2.5, 0.2)}${ln(24, 14, 24, 54, INK, 1.5)}${ln(40, 20, 40, 60, INK, 1.5)}${p("M40 6 Q50 6 50 16 Q50 24 40 34 Q30 24 30 16 Q30 6 40 6 Z", RD, INK, 2, 0.9)}${c(40, 16, 3.5, "#ffffff", "none", 0)}`),
  },
  "geographie/mensch": {
    svg: S(`${rect(6, 30, 11, 26, 1, GY, INK, 2, 0.3)}${rect(18, 18, 12, 38, 1, BL, INK, 2, 0.25)}${rect(31, 34, 10, 22, 1, GY, INK, 2, 0.3)}${rect(42, 10, 15, 46, 1, OR, INK, 2, 0.25)}${ln(4, 57, 60, 57, INK, 3)}${rect(21, 23, 3, 3, 0, INK, "none", 0)}${rect(46, 16, 3, 3, 0, INK, "none", 0)}${rect(51, 24, 3, 3, 0, INK, "none", 0)}`),
  },

  // ── Gebiete: Wirtschaft & Recht ──────────────────────────────────────────
  "wirtschaft-recht/wirtschaft": {
    glyph: "€",
    svg: S(`${ln(10, 55, 57, 55, INK, 2)}${ln(10, 55, 10, 7, INK, 2)}${p("M14 12 Q22 44 54 50", "none", BL, 3)}${p("M14 50 Q42 44 52 10", "none", OR, 3)}${c(30, 41, 3.5, INK, "none", 0)}`),
  },
  "wirtschaft-recht/recht": {
    glyph: "§",
    svg: S(`${c(32, 32, 26, PU, "none", 0, 0.12)}${t(32, 48, 44, PU, "§")}`),
  },
  "wirtschaft-recht/rechnungswesen": {
    glyph: "Soll | Haben",
    svg: S(`${ln(8, 20, 56, 20)}${ln(32, 20, 32, 56)}${t(20, 15, 11, INK, "S")}${t(44, 15, 11, INK, "H")}${ln(12, 30, 28, 30, BL, 2)}${ln(12, 38, 24, 38, BL, 2)}${ln(36, 30, 52, 30, OR, 2)}${ln(36, 38, 48, 38, OR, 2)}${ln(36, 46, 52, 46, OR, 2)}`),
  },

  // ── Gebiete: Deutsch ─────────────────────────────────────────────────────
  "deutsch/grammatik": {
    glyph: "der · die · das",
    svg: S(`${t(32, 21, 15, BL, "der")}${t(32, 39, 15, RD, "die")}${t(32, 57, 15, GR, "das")}`),
  },
  "deutsch/rechtschreibung": {
    glyph: "ß",
    svg: S(`${t(25, 46, 36, INK, "ß")}${p("M40 38 L47 47 L59 28", "none", GR, 4)}`),
  },
  "deutsch/schreiben": {
    glyph: "✎",
    svg: S(`${ln(6, 50, 30, 50, INK, 2)}${ln(6, 57, 44, 57, INK, 2)}${p("M42 6 L57 21 L28 50 L16 54 L20 42 Z", YE, INK, 3, 0.5)}${ln(37, 11, 52, 26, INK, 2)}`),
  },
  "deutsch/literatur": {
    glyph: "„…“",
    svg: S(`${p("M54 6 Q20 14 14 50 L18 52 Q30 24 54 6 Z", RD, INK, 2.5, 0.3)}${ln(14, 50, 8, 58, INK, 2.5)}${ln(28, 50, 56, 50, INK, 2)}${ln(34, 57, 56, 57, INK, 2)}`),
  },
  "deutsch/medien": {
    glyph: "▶",
    svg: S(`${rect(7, 9, 46, 46, 3, "#ffffff")}${ln(13, 17, 47, 17, INK, 4)}${rect(13, 24, 15, 13, 1, BL, "none", 0, 0.4)}${ln(32, 26, 47, 26, INK, 2)}${ln(32, 33, 44, 33, INK, 2)}${ln(13, 44, 30, 44, INK, 2)}${poly("40,38 40,54 54,46", OR, INK, 2)}`),
  },

  // ── Gebiete: Englisch ────────────────────────────────────────────────────
  "englisch/grammar": {
    glyph: "-ing",
    svg: S(`${t(32, 40, 22, OR, "-ing")}${ln(12, 47, 52, 47, INK, 2)}`),
  },
  "englisch/writing": {
    glyph: "✉",
    svg: S(`${rect(7, 15, 50, 34, 3, OR, INK, 3, 0.12)}${p("M8 17 L32 36 L56 17")}`),
  },
  "englisch/landeskunde": {
    svg: S(`${rect(24, 16, 16, 42, 1, YE, INK, 3, 0.25)}${poly("24,16 32,4 40,16", INK, INK, 2)}${c(32, 27, 6, "#ffffff", INK, 2)}${ln(32, 27, 32, 23, INK, 1.5)}${ln(32, 27, 35, 28, INK, 1.5)}${ln(14, 58, 50, 58, INK, 3)}`),
  },
  "englisch/literatur": {
    svg: S(`${ell(24, 28, 14, 17, "#ffffff", INK, 3)}${c(19, 24, 2, INK, "none", 0)}${c(29, 24, 2, INK, "none", 0)}${p("M17 34 Q24 41 31 34", "none", INK, 2)}${ell(42, 38, 14, 17, OR, INK, 3, 0.35)}${c(37, 34, 2, INK, "none", 0)}${c(47, 34, 2, INK, "none", 0)}${p("M35 48 Q42 41 49 48", "none", INK, 2)}`),
  },

  // ── Gebiete: Französisch ─────────────────────────────────────────────────
  "franzoesisch/grammaire": {
    glyph: "é è ê",
    svg: S(`${t(32, 40, 19, RD, "é è ê")}`),
  },
  "franzoesisch/civilisation": {
    glyph: "☕",
    svg: S(`${p("M14 26 L18 50 Q20 55 26 55 L38 55 Q44 55 46 50 L50 26 Z", BR, INK, 3, 0.3)}${p("M50 32 Q59 32 58 40 Q57 46 48 44", "none", INK, 3)}${p("M24 20 Q20 14 24 8 M32 20 Q28 14 32 8 M40 20 Q36 14 40 8", "none", GY, 2)}`),
  },
  "franzoesisch/litterature": {
    svg: S(`${rect(16, 7, 32, 50, 3, RD, INK, 3, 0.2)}${ln(22, 7, 22, 57, INK, 2)}${poly("38,7 44,7 44,22 41,19 38,22", OR, "none", 0)}`),
  },

  // ── Gebiete: Latein ──────────────────────────────────────────────────────
  "latein/grammatik": {
    glyph: "-us -a -um",
    svg: S(`${t(32, 38, 13, BR, "-us -a -um")}`),
  },
  "latein/lektuere": {
    svg: S(`${rect(14, 12, 36, 40, 0, YE, INK, 2, 0.2)}${rect(10, 8, 44, 8, 4, "#ffffff")}${rect(10, 48, 44, 8, 4, "#ffffff")}${ln(20, 24, 44, 24, INK, 2)}${ln(20, 31, 40, 31, INK, 2)}${ln(20, 38, 44, 38, INK, 2)}`),
  },
};
