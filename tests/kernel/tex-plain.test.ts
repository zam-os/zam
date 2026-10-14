import { describe, expect, it } from "vitest";
import { texToPlain } from "../../src/kernel/library/tex-plain.js";

/**
 * The golden table of the plain converter, drawn from the bundled corpus.
 * A change here is a change to what CLI, MCP, search and LLM prompts see.
 */
const GOLDEN: Array<[string, string]> = [
  // The card that started ADR 2026-10-14b.
  ["W_{\\text{el}} = \\frac{1}{2} C U^2", "W_el = ½CU²"],
  ["Q = \\text{konstant}", "Q = konstant"],
  ["d", "d"],
  // Scripts.
  ["x^2", "x²"],
  ["10^{-19}", "10⁻¹⁹"],
  ["e^{-\\lambda \\cdot t}", "e^(-λ·t)"],
  ["a^n", "aⁿ"],
  ["\\varepsilon_0", "ε₀"],
  ["\\varepsilon_r", "ε_r"],
  ["\\text{CO}_2", "CO₂"],
  ["\\text{CO}_3^{2-}", "CO₃²⁻"],
  ["Cu^{2+}", "Cu²⁺"],
  ["^4_2\\text{He}", "⁴₂He"],
  [
    "^2_1\\text{H} + ^3_1\\text{H} \\rightarrow ^4_2\\text{He} + ^1_0\\text{n}",
    "²₁H + ³₁H → ⁴₂He + ¹₀n",
  ],
  ["120^\\circ", "120°"],
  ["\\sum_{i=1}^{n} i", "∑_(i=1)ⁿ i"],
  // Fractions.
  ["\\frac{\\pi}{2}", "π/2"],
  ["\\frac{Q^2}{2C}", "Q²/(2C)"],
  ["\\frac{\\text{rad}}{\\text{s}}", "rad/s"],
  ["\\frac{\\ln(b)}{\\ln(a)}", "ln(b)/ln(a)"],
  ["\\frac{n!}{k! \\cdot (n - k)!}", "n!/(k!·(n - k)!)"],
  ["G \\frac{M \\cdot m}{r^2}", "G·(M·m)/r²"],
  ["\\frac{1}{LC} Q(t)", "1/LC·Q(t)"],
  ["c = 340\\,\\frac{\\text{m}}{\\text{s}}", "c = 340 m/s"],
  ["\\frac{3}{4}", "¾"],
  // Roots.
  ["\\sqrt{2}", "√2"],
  ["\\sqrt{\\frac{2 e U}{m_e}}", "√((2eU)/m_e)"],
  ["\\sqrt[3]{x}", "∛x"],
  ["\\sqrt[5]{x}", "⁵√x"],
  // Numbers and units.
  ["1{,}5^\\circ\\text{C}", "1,5°C"],
  ["E^\\circ(\\text{Li/Li}^+) = -3{,}04\\,\\text{V}", "E°(Li/Li⁺) = -3,04 V"],
  ["R_H \\approx 1{,}097 \\cdot 10^7\\,\\text{m}^{-1}", "R_H ≈ 1,097·10⁷ m⁻¹"],
  ["90\\,\\% \\implies [\\mu \\pm 1{,}64\\sigma]", "90 % ⇒ [μ ± 1,64σ]"],
  // Operators and functions.
  ["b^2 = a^2 + c^2 - 2ac \\cos \\beta", "b² = a² + c² - 2ac cos β"],
  ["\\log_a(b)", "log_a(b)"],
  ["\\ln\\left( \\frac{a}{b} \\right)", "ln(a/b)"],
  ["-x", "-x"],
  ["a - b", "a - b"],
  ["f(x, y)", "f(x, y)"],
  ["h \\rightarrow 0", "h → 0"],
  ["x \\not\\in A", "x ∉ A"],
  ["\\lim_{x \\to \\infty} f(x)", "lim_(x→∞) f(x)"],
  ["\\int f(x) \\,\\mathrm{d}x", "∫f(x) dx"],
  ["\\int_a^b f(x) \\,\\mathrm{d}x", "∫_a^b f(x) dx"],
  // Chemistry.
  [
    "2\\,\\text{H}_2\\text{O} \\rightarrow \\text{O}_2 + 4\\,\\text{H}^+ + 4\\,e^-",
    "2 H₂O → O₂ + 4 H⁺ + 4 e⁻",
  ],
  ["\\text{CO}_2 \\rightleftharpoons \\text{H}_2\\text{CO}_3", "CO₂ ⇌ H₂CO₃"],
  // Accents.
  ["\\vec{F}", "F⃗"],
  ["\\vec{AB} = \\vec{B} - \\vec{A}", "AB⃗ = B⃗ - A⃗"],
  ["\\overline{AB}", "A̅B̅"],
  ["\\ddot{Q}", "Q̈"],
  // Structures.
  ["\\begin{pmatrix} 1 \\\\ 2 \\\\ 0 \\end{pmatrix}", "(1, 2, 0)"],
  ["\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", "[[a, b], [c, d]]"],
  [
    "f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}",
    "f(x) = {x, x ≥ 0; -x, x < 0}",
  ],
  ["\\begin{aligned} a &= b + c \\\\ &= d \\end{aligned}", "a = b + c; = d"],
  ["\\binom{6}{2}", "C(6, 2)"],
  ["\\mathbb{R}", "ℝ"],
  ["\\underbrace{a + b}_{\\text{Summe}}", "a + b (Summe)"],
  ["\\xrightarrow{\\text{Kat}}", "–Kat→"],
  ["17 \\equiv 2 \\pmod{5}", "17 ≡ 2 (mod 5)"],
  ["E: \\vec{X} = \\vec{P}", "E: X⃗ = P⃗"],
];

describe("texToPlain", () => {
  it.each(GOLDEN)("%s", (tex, plain) => {
    expect(texToPlain(tex)).toBe(plain);
  });

  it("returns a refused formula as written instead of throwing", () => {
    expect(texToPlain("\\color{red}{x}")).toBe("\\color{red}{x}");
  });

  it("keeps spaces inside \\text", () => {
    expect(texToPlain("1\\,\\text{Glucose } (C_6)")).toBe("1 Glucose (C₆)");
  });
});
