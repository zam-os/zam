# iOS Information Architecture and Design System

**Status:** Accepted — decided by Thomas, 2026-08-08 ("das UI komplett reviewed
und neu gedacht … Einfachheit in der Bedienung an erster Stelle"). Implemented
on `feat/ios-standalone` and verified on the iPad (A16) simulator in light and
dark.
**Deciders:** Thomas (project owner)
**Related:**
[2026-08-08-ios-standalone-app.md](2026-08-08-ios-standalone-app.md) ·
[2026-07-26-ipados-companion-target.md](2026-07-26-ipados-companion-target.md) ·
[2026-07-10-recall-card-ux.md](2026-07-10-recall-card-ux.md)

---

## Context

The mobile UI was a companion's UI: one dashboard with three stacked buttons,
every other screen reached by leaving it, a dark "premium" surface of ambient
glows and glassmorphism, and fixed pixel type that ignored the system text
size. That is coherent for something you open once a day for one thing. It is
not coherent for the app itself, which now has to answer "where am I, and how
do I get back" without the learner thinking about it.

A full-screen `.xcodeproj`-native rewrite was considered and rejected: the
learning kernel is TypeScript, and SwiftUI would mean either porting FSRS,
the queue and the prompter to Swift, or embedding a JS runtime to avoid it.
Both fork the thing the project most needs kept single.

---

## Decisions

### 1. Two navigation levels, and only two

**Root views** fill the screen and replace each other: first run, pairing, the
app, and a review. **Tabs** live inside the app — Lernen, Inhalte, Fortschritt,
Einstellungen — and are always one tap apart.

Review is deliberately a *root* view rather than a fifth tab. The tab bar
disappears while a card is on screen: nothing should invite the learner away
mid-card, and the four ratings want the space the bar would otherwise take.

`mobile/src/ui/nav.ts` owns both levels. A tab refreshes what it shows on
arrival rather than trusting whoever navigated there.

### 2. Apple's palette, Apple's type scale, brand in two places

The system palette, the system type scale, and grouped inset lists as in
Settings. The brand gradient survives on exactly two elements: the wordmark
and the primary action. Everything else is label, background and separator.

A learning app is used daily, for a few minutes, often tired. What it needs is
to disappear behind the content.

### 3. Dynamic Type is honoured, not approximated

`font: -apple-system-body` on the body resolves to the learner's chosen
content size, and every other size is a multiple of it in `em`. A learner who
needs large text is exactly the learner who cannot work around a fixed 13px
label.

Also non-negotiable: 44pt minimum touch targets, `prefers-reduced-motion`,
visible focus for an external keyboard, and a 16px floor on inputs so iOS does
not zoom the page on focus.

### 4. The interface speaks the learner's language, not the schema's

"3 Karten in der Queue — 0 fällig, 3 neu, 0 erneut lernen · Domänen: zam"
became "3 Karten warten / 3 neu". Empty buckets are not listed. A library with
nothing scheduled says so rather than showing zeroes. Bloom levels and card
state left the card meta — they drive prompt generation, they are not
something to read on every card. Due dates lost their seconds. "Domäne" became
"Fach", "Bridge-JSON" left the import screen, and a learner is never called a
"Lernender" on a device with one learner.

The rule: a word that exists because of the data model has to earn its place
on screen, and mostly cannot.

### 5. The markup/TypeScript contract is a test

Element lookups run at module scope, so one renamed id aborts the whole
bootstrap — the app launches, paints correctly, and ignores every tap with
nothing on screen to say why. That happened during this rebuild (a dropped
`#voice-controls`) and cost a full device build to find.

`tests/mobile/dom-contract.test.ts` compares the ids the code looks up against
the ids the markup defines. `mobile/src/boot.ts` loads `main.ts` through a
dynamic import so a failure that slips past the test becomes a sentence on
screen instead of a mystery.

### 6. No `backdrop-filter` inside a fixed frame

The tab bar's blur made WKWebView sample the wrong layer and paint the tab
icons a second time over the status bar. The bar is opaque. Recorded because
the next person to reach for a frosted surface will reach for the same API.

---

## Consequences

**Easier**

- Every screen is one of four things: a screen, an inset list, a button, a
  field. There is no page with layout rules of its own.
- Adding a screen is a section plus a nav entry.
- Light and dark, and every Dynamic Type size, come from the tokens rather
  than from per-screen care.

**Harder / not done**

- `mobile/src/main.ts` is still ~2000 lines. Navigation, first run and the
  design system were extracted; the functional blocks (voice, import,
  evaluation) were not, because splitting working code with no coverage on the
  UI wiring is how the `#voice-controls` class of bug gets made. The
  decomposition into `mobile/src/screens/*.ts` remains outstanding and should
  precede the next screen-level feature.
- Haptics on rating would want a small Swift plugin; not built.
- The design system is CSS in a WebView, so it approximates UIKit rather than
  being it. Anything Apple changes in a system control, ZAM does not get.

---

## Citations

- `mobile/src/ui/tokens.css`, `mobile/src/ui/components.css`, `mobile/src/ui/nav.ts`
- `mobile/src/setup/wizard.ts`, `mobile/src/boot.ts`
- `tests/mobile/dom-contract.test.ts`
