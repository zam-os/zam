# Studio redesign — click-through checklist

Manual test of `feat/studio-redesign` (steps 1–5) in the real desktop app,
before the PR. The automated suite, both typechecks and static screenshots of
the built UI already pass; what they cannot show is the app running: Tauri,
the bridge, real data, focus and clicks. Delete this file once the branch is
merged (docs/plans keeps only plans with open work).

Each item names an action and what should happen. Report a failure by its
id (for example `S7`), what you saw, and the window width and theme.

## Before you start

- Run the app from this worktree. In dev mode the app finds its CLI through
  `ZAM_HOME` first and then `~/.zam/cli_path`, which may point at another
  checkout, so set it explicitly:

  ```bash
  cd /Users/thomas/src/zam-fable/desktop
  ZAM_HOME=/Users/thomas/src/zam-fable npm run tauri dev
  ```

- The app opens your real library in `~/.zam`. Settings you change here
  (learning mode, study plan, theme) are real settings. **Remove** in the card
  menu removes a real card: open its dialog, then cancel. Use a card you do
  not mind rating for the session tests.
- Test once in light and once in dark (Settings → Appearance), and once with
  the window narrower than about 860 px.

## A — Shell and sidebar

- [ ] **A1** The window shows the new look from the first paint: cool grey
      ground, white cards, no blurred colour clouds, no purple–cyan gradients.
- [ ] **A2** Headings use Bricolage Grotesque, text uses Atkinson
      Hyperlegible. Works offline too: the fonts are bundled.
- [ ] **A3** The startup overlay runs and disappears as before.
- [ ] **A4** Sidebar: Heute/Today, Inhalte, Wissensnetz, Statistik at the
      top; Einstellungen, the AI status and the language badge at the foot.
- [ ] **A5** Heute carries the due count as an orange badge; it matches the
      number on the Today card and is hidden at zero.
- [ ] **A6** Each entry opens its view and is highlighted while open.
- [ ] **A7** The AI status moves from "Checking AI…" to its real state.
- [ ] **A8** The language menu opens upwards; switching the language relabels
      the sidebar, the Today headline and the date.
- [ ] **A9** Below ~860 px the sidebar becomes a top bar; the language menu
      then opens downwards.

## H — Today

- [ ] **H1** The date reads in the current language ("Samstag, 11. Oktober").
- [ ] **H2** The headline reads "N Karten sind fällig", "1 Karte ist fällig",
      or "Gerade ist nichts fällig" at zero; the card stack shows the count.
- [ ] **H3** "Etwa N Min. in deinem Tempo" appears only when the last 30 days
      hold reviews with measured time; otherwise there is no estimate line.
- [ ] **H4** The active domains show as chips.
- [ ] **H5** "Jetzt lernen" is enabled exactly when something is due.
- [ ] **H6** At zero due: the caught-up line, or the no-cards line on an
      empty deck, and the library-topics button where the library has topics.
- [ ] **H7** "Diese Woche": seven days ending today, today's bar in solid
      blue, counts consistent with Statistik → Day; "Statistik" opens it.
- [ ] **H8** The setup strip (when setup is unfinished) has padding, a dashed
      frame, and its rows open the matching step.

## L — Learning session

- [ ] **L1** "Jetzt lernen" opens the session in focus mode: no sidebar, a
      session bar with "Sitzung beenden", "1 / N", a progress bar, the mode
      switcher and the ⋯ menu.
- [ ] **L2** The progress bar grows after each rating; the count advances.
- [ ] **L3** The mode switcher shows Flash, Auswahl/Choice, KI/AI, Auto
      without emoji; clicking and the arrow keys switch modes and the card
      follows.
- [ ] **L4** The card has an orange head rule, the domain chip and the Bloom
      meter (filled segments match the level).
- [ ] **L5** The question is set in the display face; "Die Antwort hat N
      Punkte." appears on multi-point cards.
- [ ] **L6** AI mode: the field is labelled "Deine Antwort"; Ctrl+Enter (⌘+Enter)
      reveals. In Flash the label disappears with the field and clicking the
      question reveals.
- [ ] **L7** After the reveal in AI mode: your answer and the reference answer
      side by side, the feedback below, then the follow-up chat. In Flash the
      reference answer takes the full row.
- [ ] **L8** Rating bar: "Nochmal" in orange on its own; Schwer, Gut, Einfach
      in blue, getting darker; keys 1–4 rate; buttons are inactive while the
      rating is saved; there is no Remove button in the bar.
- [ ] **L9** With long feedback, the rating bar stays stuck at the bottom of
      the window while you scroll.
- [ ] **L10** ⋯ menu: "Karte bearbeiten" opens the inline editor (before and
      after the reveal); "Im Editor öffnen" jumps to the card in Inhalte;
      "Entfernen" opens the stop dialog (cancel it). A click outside closes
      the menu.
- [ ] **L11** Choice mode: options appear, 1–9 picks, the result shows, the
      chat sits above the folded reference answer, both Next buttons work,
      no rating bar.
- [ ] **L12** Auto mode shows its stage badge in the card head.
- [ ] **L13** While the AI evaluates, the busy overlay hides the card body;
      the "taking longer" dialog's buttons still work.
- [ ] **L14** Esc or "Sitzung beenden" shows the summary without the sidebar;
      "Zurück zur Übersicht" returns to Today with the sidebar back.
- [ ] **L15** Narrow window: the session bar and the rating groups wrap
      without overlapping.
- [ ] **L16** Dark: rating buttons, chips and the reference box stay legible.

## W — Knowledge graph

- [ ] **W1** Sidebar → Wissensnetz from Today: the graph opens and its Back
      button returns to Today.
- [ ] **W2** Sidebar → Wissensnetz while Inhalte is open: Back returns to
      Lern-Karten.
- [ ] **W3** The "Wissensnetz (3D)" button in the Inhalte header: Back
      returns to Lern-Karten.
- [ ] **W4** Wissensnetz stays highlighted in the sidebar while the graph is
      open; clicking it again changes nothing.

## I — Learning content

- [ ] **I1** Header: "Lerninhalte", then Wissensnetz (3D), Bonus only while
      items are kept, Importieren, Neue Karte.
- [ ] **I2** Importieren opens a menu with Foto/PDF, Bibliotheksthemen,
      Ziel-Import, Datei importieren — and no Lehrplan entry.
- [ ] **I3** Keyboard: ArrowDown on the button opens it; arrows, Home and End
      move; Esc closes and returns focus to the button; a click outside
      closes it.
- [ ] **I4** Each entry opens exactly what its old button opened: photo/PDF
      import, library topics, goal import, file import.
- [ ] **I5** Ziel-Import opens a plain dialog — no "Schritt x von y", no Skip,
      no "Später".
- [ ] **I6** In the dialog: name a goal → propose a breakdown → drill a level
      → draft cards → import the selection; the success line appears.
- [ ] **I7** Without a text model, the dialog offers the model setup, which
      opens the first-run flow at its model page.
- [ ] **I8** Close mid-way, reopen: the half-defined goal is still there.
      Close after an import, reopen: an empty goal; the new cards are in the
      Personal list.
- [ ] **I9** Esc closes the dialog.
- [ ] **I10** Settings → System → "Run setup again" still reaches the
      first-run goal step, which still works.
- [ ] **I11** Lern-Karten / Quellen are underline tabs; Quellen hides the
      header actions; Quellen → Lehrplan still opens the curriculum.
- [ ] **I12** The Personal / Not chosen / Unpublished segments, search and
      filters behave as before.

## S — Settings and statistics

- [ ] **S1** Settings opens in Simple; there is no "Back to dashboard".
- [ ] **S2** The section list beside the cards names the visible cards in
      their on-screen order; switching to Advanced adds the advanced cards.
- [ ] **S3** Clicking a section scrolls to its card; the highlight follows
      as you scroll.
- [ ] **S4** Narrow window: the section list becomes a row above the cards.
- [ ] **S5** Learning mode: five cards, the current mode selected; choosing
      another saves at once (status line), and the session's mode switcher
      shows it.
- [ ] **S6** The help line under the modes follows the selection; Auto shows
      the "Später ohne Tippen" toggle.
- [ ] **S7** Study plan: choosing a plan saves at once ("Lernplan gespeichert."),
      without a save button.
- [ ] **S8** Advanced: editing "Neue Karten pro Sitzung" switches the plan to
      Custom and saves on Enter or when the field loses focus — not while
      typing; a checkbox saves at once.
- [ ] **S9** Theme: Hell/Dunkel switch at once and survive a restart.
- [ ] **S10** The other cards (AI models → Configure, Data → Backup, update
      check, …) work as before.
- [ ] **S11** After a language switch the section list shows the new
      headings the next time Settings opens.
- [ ] **S12** Statistik: plain header without a back button; Day/Week/Month
      and the activity list work.

## R — Regressions elsewhere

- [ ] **R1** MCP Studio panel (Claude Desktop or VS Code): Learning Content
      still loads and its import buttons work; the panel's look is unchanged.
- [ ] **R2** MCP Recall panel: the Flash/KI toggle reads without emoji and
      still switches.
- [ ] **R3** Windows or Linux build if at hand: fonts render, the sidebar
      and the segmented choices show their selected state.
