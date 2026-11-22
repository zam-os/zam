/**
 * Sinnbilder for Realschule Mathe 9 (and grade 8 linear functions), drawn
 * by a text-only model — Claude, in the spike session that built this file.
 * SVG is text, so any model that writes code can draw them. Each passes
 * `validateEmblemSvg`. Ink #1d2b4f, accent orange #e8590c, blue #2f6fdf.
 */
import type { Emblem } from "./model.ts";

const S = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`;
const INK = "#1d2b4f";
const OR = "#e8590c";
const BL = "#2f6fdf";
const t = (x: number, y: number, size: number, color: string, text: string, anchor = "middle") =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${color}" text-anchor="${anchor}">${text}</text>`;
const axes = (y: number, x: number) =>
  `<line x1="6" y1="${y}" x2="58" y2="${y}" stroke="${INK}" stroke-width="2"/><line x1="${x}" y1="60" x2="${x}" y2="4" stroke="${INK}" stroke-width="2"/>`;

export const SAMPLE_EMBLEMS: Record<string, Partial<Emblem>> = {
  "kreisumfang-kreisflaeche-pi": {
    glyph: "U = 2πr",
    svg: S(`<circle cx="32" cy="32" r="24" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="3"/><line x1="32" y1="32" x2="56" y2="32" stroke="${OR}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="2.5" fill="${INK}"/>${t(30, 25, 16, INK, "π")}`),
  },
  "kreissektor-kreisbogen": {
    glyph: "α/360° · 2πr",
    svg: S(`<circle cx="32" cy="32" r="24" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M32 32 L56 32 A24 24 0 0 0 44 11.2 Z" fill="${BL}" fill-opacity="0.3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M56 32 A24 24 0 0 0 44 11.2" fill="none" stroke="${OR}" stroke-width="4" stroke-linecap="round"/>${t(41, 28, 9, INK, "α")}`),
  },
  "zylinder-oberflaeche-volumen": {
    glyph: "V = πr²h",
    svg: S(`<ellipse cx="32" cy="14" rx="18" ry="6" fill="${BL}" fill-opacity="0.25" stroke="${INK}" stroke-width="3"/><line x1="14" y1="14" x2="14" y2="50" stroke="${INK}" stroke-width="3"/><line x1="50" y1="14" x2="50" y2="50" stroke="${INK}" stroke-width="3"/><path d="M14 50 A18 6 0 0 0 50 50" fill="none" stroke="${INK}" stroke-width="3"/><path d="M14 50 A18 6 0 0 1 50 50" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/><line x1="32" y1="14" x2="50" y2="14" stroke="${OR}" stroke-width="2.5"/>`),
  },
  "pyramide-kegel-spitzkoerper": {
    glyph: "V = ⅓·G·h",
    svg: S(`<path d="M14 50 L32 8 L50 50" fill="${BL}" fill-opacity="0.18" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M14 50 A18 6 0 0 0 50 50" fill="none" stroke="${INK}" stroke-width="3"/><path d="M14 50 A18 6 0 0 1 50 50" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/><line x1="32" y1="8" x2="32" y2="50" stroke="${OR}" stroke-width="2.5" stroke-dasharray="4 3"/><line x1="32" y1="8" x2="50" y2="50" stroke="${OR}" stroke-width="3.5" stroke-linecap="round"/>`),
  },
  "kugel-oberflaeche-volumen": {
    glyph: "V = 4/3·πr³",
    svg: S(`<circle cx="32" cy="32" r="24" fill="${BL}" fill-opacity="0.18" stroke="${INK}" stroke-width="3"/><path d="M8 32 A24 8 0 0 0 56 32" fill="none" stroke="${INK}" stroke-width="2.5"/><path d="M8 32 A24 8 0 0 1 56 32" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 3"/><line x1="32" y1="32" x2="49" y2="15" stroke="${OR}" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="32" r="2.5" fill="${INK}"/>`),
  },
  "lineare-gleichung-zwei-variablen": {
    glyph: "ax + by = c",
    svg: S(`${axes(50, 14)}<line x1="8" y1="56" x2="56" y2="12" stroke="${BL}" stroke-width="4" stroke-linecap="round"/><circle cx="33" cy="33" r="3.5" fill="${OR}"/>`),
  },
  "gleichsetzungs-einsetzungsverfahren": {
    glyph: "y einsetzen",
    svg: S(`<rect x="6" y="8" width="40" height="16" rx="4" fill="${BL}" fill-opacity="0.2" stroke="${INK}" stroke-width="2.5"/><rect x="18" y="40" width="40" height="16" rx="4" fill="${OR}" fill-opacity="0.18" stroke="${INK}" stroke-width="2.5"/>${t(26, 20, 10, INK, "y = …")}${t(38, 52, 10, INK, "… y …")}<path d="M48 16 C60 20 60 32 50 38" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round"/><path d="M50 38 L51 31 M50 38 L57 37" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round"/>`),
  },
  "additionsverfahren-elimination": {
    glyph: "I + II",
    svg: S(`${t(34, 17, 11, INK, "2x + y")}${t(34, 31, 11, INK, "3x − y")}${t(10, 31, 14, OR, "+")}<line x1="12" y1="37" x2="56" y2="37" stroke="${INK}" stroke-width="2.5"/>${t(34, 54, 13, BL, "5x")}<line x1="44" y1="10" x2="52" y2="32" stroke="${OR}" stroke-width="2.5"/>`),
  },
  "loesungsfaelle-linearer-gleichungssysteme": {
    glyph: "1 · 0 · ∞",
    svg: S(`<rect x="3" y="12" width="18" height="38" rx="3" fill="none" stroke="${INK}" stroke-width="2"/><rect x="23" y="12" width="18" height="38" rx="3" fill="none" stroke="${INK}" stroke-width="2"/><rect x="43" y="12" width="18" height="38" rx="3" fill="none" stroke="${INK}" stroke-width="2"/><line x1="5" y1="46" x2="19" y2="16" stroke="${BL}" stroke-width="2.5"/><line x1="5" y1="18" x2="19" y2="44" stroke="${OR}" stroke-width="2.5"/><line x1="25" y1="38" x2="39" y2="18" stroke="${BL}" stroke-width="2.5"/><line x1="25" y1="48" x2="39" y2="28" stroke="${OR}" stroke-width="2.5"/><line x1="45" y1="44" x2="59" y2="18" stroke="${OR}" stroke-width="5"/><line x1="45" y1="44" x2="59" y2="18" stroke="${BL}" stroke-width="2"/>${t(12, 61, 9, INK, "1")}${t(32, 61, 9, INK, "0")}${t(52, 61, 9, INK, "∞")}`),
  },
  "hypotenuse-lage": {
    glyph: "c ↔ ∟",
    svg: S(`<path d="M10 54 L54 54 L10 14 Z" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M10 46 L18 46 L18 54" fill="none" stroke="${INK}" stroke-width="2"/><line x1="54" y1="54" x2="10" y2="14" stroke="${OR}" stroke-width="4.5" stroke-linecap="round"/>${t(38, 30, 12, OR, "c")}`),
  },
  "satz-des-pythagoras": {
    glyph: "a² + b² = c²",
    svg: S(`<polygon points="22,38 40,38 40,56 22,56" fill="${BL}" fill-opacity="0.35" stroke="${INK}" stroke-width="2"/><polygon points="22,38 22,26 10,26 10,38" fill="${BL}" fill-opacity="0.35" stroke="${INK}" stroke-width="2"/><polygon points="22,26 40,38 52,20 34,8" fill="${OR}" fill-opacity="0.35" stroke="${INK}" stroke-width="2"/><polygon points="22,38 40,38 22,26" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`),
  },
  "umkehrung-satz-des-pythagoras": {
    glyph: "⇒ 90°",
    svg: S(`<path d="M10 52 L50 52 L10 20 Z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M10 44 L18 44 L18 52" fill="none" stroke="${OR}" stroke-width="2.5"/>${t(36, 20, 12, BL, "a²+b²")}<path d="M38 38 L44 45 L56 29" fill="none" stroke="#2f9e44" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  },
  "kathetensatz-hoehensatz": {
    glyph: "h² = p·q",
    svg: S(`<path d="M8 48 L56 48 L20 27.2 Z" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><line x1="20" y1="27.2" x2="20" y2="48" stroke="${OR}" stroke-width="3" stroke-dasharray="4 3"/>${t(25, 42, 9, OR, "h")}${t(14, 58, 9, INK, "p")}${t(38, 58, 9, INK, "q")}`),
  },
  "trigonometrie-sinus-kosinus": {
    glyph: "sin α = G/H",
    svg: S(`<path d="M8 52 L54 52 L54 16 Z" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M46 52 L46 44 L54 44" fill="none" stroke="${INK}" stroke-width="2"/><path d="M20 52 A12 12 0 0 0 17.5 44.6" fill="none" stroke="${OR}" stroke-width="2.5"/>${t(24, 49, 8, OR, "α")}<line x1="54" y1="52" x2="54" y2="16" stroke="${OR}" stroke-width="4"/>${t(59, 36, 9, OR, "G")}${t(31, 62, 9, BL, "A")}`),
  },
  "trigonometrie-tangens": {
    glyph: "tan α = G/A",
    svg: S(`<path d="M8 52 L54 52 L54 22 Z" fill="${OR}" fill-opacity="0.12" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><line x1="54" y1="52" x2="54" y2="22" stroke="${OR}" stroke-width="4.5"/><line x1="8" y1="52" x2="54" y2="52" stroke="${BL}" stroke-width="4.5"/><path d="M20 52 A12 12 0 0 0 18 45.4" fill="none" stroke="${INK}" stroke-width="2"/>${t(31, 20, 11, INK, "tan")}`),
  },
  "trigonometrischer-pythagoras-spezialwerte": {
    glyph: "sin²+cos²=1",
    svg: S(`<circle cx="28" cy="36" r="22" fill="none" stroke="${INK}" stroke-width="2.5"/><line x1="28" y1="36" x2="47" y2="25" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><line x1="47" y1="25" x2="47" y2="36" stroke="${OR}" stroke-width="3"/><line x1="28" y1="36" x2="47" y2="36" stroke="${BL}" stroke-width="3"/>${t(40, 26, 9, INK, "1")}`),
  },
  "normalparabel-scheitelpunktform": {
    glyph: "(x−d)² + e",
    svg: S(`${axes(54, 12)}<path d="M22 8 Q36 72 50 8" fill="none" stroke="${BL}" stroke-width="3.5" stroke-linecap="round"/><circle cx="36" cy="40" r="4" fill="${OR}"/>${t(46, 47, 10, OR, "S")}`),
  },
  "quadratische-ergaenzung-scheitelpunkt": {
    glyph: "+ (b/2)²",
    svg: S(`<rect x="10" y="10" width="30" height="30" fill="${BL}" fill-opacity="0.3" stroke="${INK}" stroke-width="2"/><rect x="40" y="10" width="12" height="30" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="2"/><rect x="10" y="40" width="30" height="12" fill="${BL}" fill-opacity="0.15" stroke="${INK}" stroke-width="2"/><rect x="40" y="40" width="12" height="12" fill="${OR}" fill-opacity="0.55" stroke="${OR}" stroke-width="2" stroke-dasharray="3 2"/>${t(25, 29, 11, INK, "x²")}${t(46, 50, 9, INK, "+")}`),
  },
  "quadratische-gleichungen-mitternachtsformel": {
    glyph: "±√(b²−4ac)",
    svg: S(`<path d="M50 6 A14 14 0 1 0 60 28 A11 11 0 1 1 50 6 Z" fill="#f2c94c" stroke="${INK}" stroke-width="2"/>${t(24, 46, 22, INK, "±√")}<line x1="8" y1="52" x2="40" y2="52" stroke="${INK}" stroke-width="2"/>${t(24, 61, 8, INK, "2a")}`),
  },
  "nullstellen-und-linearfaktoren": {
    glyph: "(x−x₁)(x−x₂)",
    svg: S(`<line x1="4" y1="36" x2="60" y2="36" stroke="${INK}" stroke-width="2"/><path d="M12 8 Q32 76 52 8" fill="none" stroke="${BL}" stroke-width="3.5" stroke-linecap="round"/><circle cx="23.6" cy="36" r="4" fill="${OR}"/><circle cx="40.4" cy="36" r="4" fill="${OR}"/>`),
  },
  "baumdiagramme-pfadregeln-zufall": {
    glyph: "Pfad: p₁·p₂",
    svg: S(`<line x1="8" y1="32" x2="30" y2="48" stroke="${INK}" stroke-width="2.5"/><line x1="30" y1="16" x2="54" y2="24" stroke="${INK}" stroke-width="2"/><line x1="30" y1="48" x2="54" y2="40" stroke="${INK}" stroke-width="2"/><line x1="30" y1="48" x2="54" y2="56" stroke="${INK}" stroke-width="2"/><line x1="8" y1="32" x2="30" y2="16" stroke="${OR}" stroke-width="3.5"/><line x1="30" y1="16" x2="54" y2="8" stroke="${OR}" stroke-width="3.5"/><circle cx="8" cy="32" r="3.5" fill="${INK}"/><circle cx="30" cy="16" r="3" fill="${OR}"/><circle cx="30" cy="48" r="3" fill="${BL}"/><circle cx="54" cy="8" r="3.5" fill="${OR}"/><circle cx="54" cy="24" r="3" fill="${BL}"/><circle cx="54" cy="40" r="3" fill="${BL}"/><circle cx="54" cy="56" r="3" fill="${BL}"/>`),
  },
  "vierfeldertafel-bedingte-wahrscheinlichkeit": {
    glyph: "P(A|B)",
    svg: S(`<rect x="8" y="8" width="48" height="48" rx="3" fill="none" stroke="${INK}" stroke-width="2.5"/><line x1="8" y1="24" x2="56" y2="24" stroke="${INK}" stroke-width="2"/><line x1="8" y1="40" x2="56" y2="40" stroke="${INK}" stroke-width="2"/><line x1="24" y1="8" x2="24" y2="56" stroke="${INK}" stroke-width="2"/><line x1="40" y1="8" x2="40" y2="56" stroke="${INK}" stroke-width="2"/><rect x="25" y="25" width="14" height="14" fill="${OR}" fill-opacity="0.5"/><rect x="25" y="41" width="14" height="14" fill="${BL}" fill-opacity="0.25"/>${t(16, 37, 9, INK, "A")}${t(32, 20, 9, INK, "B")}`),
  },
  "statistische-kenngroessen-median-quartile": {
    glyph: "x̄ · Median",
    svg: S(`<line x1="6" y1="46" x2="58" y2="46" stroke="${INK}" stroke-width="2"/><circle cx="12" cy="40" r="3" fill="${BL}"/><circle cx="20" cy="40" r="3" fill="${BL}"/><circle cx="20" cy="33" r="3" fill="${BL}"/><circle cx="28" cy="40" r="3" fill="${BL}"/><circle cx="28" cy="33" r="3" fill="${BL}"/><circle cx="28" cy="26" r="3" fill="${BL}"/><circle cx="36" cy="40" r="3" fill="${BL}"/><circle cx="56" cy="40" r="3" fill="${BL}"/><line x1="28" y1="14" x2="28" y2="52" stroke="${OR}" stroke-width="2.5" stroke-dasharray="3 2"/><line x1="33" y1="12" x2="33" y2="52" stroke="${INK}" stroke-width="2"/>${t(28, 61, 8, OR, "Med")}${t(40, 12, 9, INK, "x̄")}`),
  },
  "boxplot-datenverteilung-spannweite": {
    glyph: "Q₁ · Med · Q₃",
    svg: S(`<line x1="8" y1="32" x2="20" y2="32" stroke="${INK}" stroke-width="2.5"/><line x1="44" y1="32" x2="56" y2="32" stroke="${INK}" stroke-width="2.5"/><line x1="8" y1="24" x2="8" y2="40" stroke="${INK}" stroke-width="2.5"/><line x1="56" y1="24" x2="56" y2="40" stroke="${INK}" stroke-width="2.5"/><rect x="20" y="20" width="24" height="24" fill="${BL}" fill-opacity="0.25" stroke="${INK}" stroke-width="2.5"/><line x1="30" y1="20" x2="30" y2="44" stroke="${OR}" stroke-width="3.5"/>`),
  },
  "lineare-funktion-steigung-achsenabschnitt": {
    glyph: "f(x) = mx + t",
    svg: S(`${axes(52, 14)}<line x1="6" y1="46" x2="58" y2="14" stroke="${BL}" stroke-width="3.5" stroke-linecap="round"/><path d="M28 32.5 L44 32.5 L44 22.6" fill="none" stroke="${OR}" stroke-width="2.5"/><circle cx="14" cy="41" r="3.5" fill="${OR}"/>${t(50, 30, 9, OR, "m")}${t(20, 48, 8, OR, "t")}`),
  },
  "geradengleichung-zwei-punkte-punktsteigung": {
    glyph: "m = Δy/Δx",
    svg: S(`<line x1="6" y1="54" x2="58" y2="10" stroke="${BL}" stroke-width="3" stroke-linecap="round"/><circle cx="18" cy="43.8" r="4.5" fill="${OR}"/><circle cx="46" cy="20.2" r="4.5" fill="${OR}"/>${t(18, 60, 9, INK, "P₁")}${t(46, 11, 9, INK, "P₂")}`),
  },
  "lagebeziehungen-geraden-parallel-orthogonal": {
    glyph: "m₁·m₂ = −1",
    svg: S(`<line x1="8" y1="50" x2="50" y2="8" stroke="${BL}" stroke-width="3"/><line x1="18" y1="58" x2="58" y2="18" stroke="${BL}" stroke-width="3" stroke-dasharray="5 3"/><line x1="10" y1="10" x2="54" y2="54" stroke="${OR}" stroke-width="3"/><path d="M33.2 24.8 L37.4 29 L33.2 33.2" fill="none" stroke="${INK}" stroke-width="2"/>`),
  },
  "direkte-indirekte-proportionalitaet-hyperbel": {
    glyph: "y=k·x | y=k/x",
    svg: S(`<line x1="6" y1="54" x2="58" y2="54" stroke="${INK}" stroke-width="2"/><line x1="10" y1="60" x2="10" y2="4" stroke="${INK}" stroke-width="2"/><line x1="10" y1="54" x2="56" y2="10" stroke="${BL}" stroke-width="3" stroke-linecap="round"/><path d="M16 8 Q20 46 58 50" fill="none" stroke="${OR}" stroke-width="3" stroke-linecap="round"/>`),
  },
};
