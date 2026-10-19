# ZAM Academy: Cells from academy.zam-os.org, One-Click Enrolment, Links Back to the Lesson

**Status:** Proposed\
**Date:** 2026-10-19\
**Deciders:** Thomas (project owner)\
**Related:**
[2026-07-17](2026-07-17-okf-knowledge-base.md) (sources that cards cite) ·
[2026-08-14](2026-08-14-central-learning-atoms-and-identity.md) (Decisions
8–10: rebuildable during the pilot; ids stable once released; the cell has
precedence) ·
[2026-10-02](2026-10-02-library-topics.md) (library topics keyed by
`source_link` without its fragment) ·
[2026-10-08b](2026-10-08b-corporate-deployment-baseline.md) (library content
is untrusted; `safeFetch`; policy keys no argument may write) ·
[2026-10-10](2026-10-10-learning-content-sources.md) (Lern-Karten and
Quellen) ·
[2026-10-14](2026-10-14-topic-import-and-source-provenance.md) (Decision 4:
reading up opens the web page)

---

## Context

**Two phases of learning.** Some knowledge has to be practised before it can
be remembered. A UML class diagram is understood by drawing one, not by
reading flashcards about it. The ZAM Academy pairs both phases:

1. A hands-on training app builds the understanding.
2. A ZAM cell keeps it with spaced repetition, and every card links back to
   the lesson where the learner practised.

**How it started.** PR #417 (written with Gemini) put a UML 2.5.1 editor with
24 lessons into this repository, together with a bundled cell. Two reviews
found that the join to ZAM did not work:

- The cell's cards and the app's own card list (its CSV export) were two
  different syllabi under the same ids.
- The card links were repository paths that no installed ZAM can open.
- The recommended enrolment step was a copied `zam bridge` command.
- Studio could not enrol the cell at all.
- Review showed the link as plain text.

**Owner decisions, 2026-10-19.** These are not reopened here:

- The training apps are called **ZAM Academy**.
- They live in **`zam-os/zam-academy`**, one folder per app.
- They are served at **`https://academy.zam-os.org/<app>/`**. UML is live at
  `/uml/`.
- Cards cite **`https://academy.zam-os.org/<app>/#lesson=<lesson id>`**. The
  fragment keeps one app = one library topic, and lesson ids are stable.

PR #417 now carries only the zam side: the rebuilt cell `zam-academy:uml`,
plus `source_link` support on KVT atoms and items.

**The goal sets the pace.** The target is about one new topic per week,
roughly 50 a year, linked to Bavarian LehrplanPLUS or useful for software
development. Several models and later contributors will build them. Cells
that ship only inside ZAM releases cannot keep up with that, and a card set
kept apart from its app drifts, as #417 showed.

**Today's mechanics:**

- **Bundled cells** are fixtures compiled into each release
  (`src/kernel/library/bundled-cells.ts`). `reconcileInstalledBundledTiles`
  reinstalls the ones whose version changed. A team library refuses this;
  there, tiles change only through `zam team reinstall-tiles`.
- **Studio enrols a cell only through the curriculum wizard,** which walks
  registered curriculum providers. `zam-academy` is not one, and should not
  be: it is not a school curriculum. Lern-Karten lists only cells the
  learner already holds. Agents can enrol any bundled cell
  (`zam_bundled_cell_enrol`).
- **Review shows `source_link` as code text** after the answer is revealed
  (`desktop/src/main.ts`, the reveal rows). The Atlas already opens a web
  page on the learner's click (ADR 2026-10-14 Decision 4), and MCP Apps
  panels open links through the host's `openLink`.
- **The review context fetches http(s) links** through `safeFetch` and turns
  the HTML into text. For a single-page app that text is little more than
  the page title. The corporate policy key `sourceLinks.remoteFetch` turns
  content fetches off.

## Decisions

### 1. A topic is an app plus its cell, kept together in zam-os/zam-academy

- **The cell is the topic's only card source.** Each app folder holds its
  cell as a KVT tile, `<app>/cell.json`. An app ships no card list or card
  export of its own.
- **App and cell change in the same PR.** Renaming a lesson and updating the
  cards that cite it is one change, reviewed together.
- **That repository's CI checks the join.** It installs `cell.json` into a
  throw-away library with the published `zam-core` (pinned version), the same
  validation a bundled tile passes. It also checks that every card's link
  names an existing lesson of that app, and that the app's lesson ids match
  the pinned list.
- **ZAM keeps a bundled copy.** Each ZAM release copies the current academy
  cells into its fixtures, so the first run and offline use still work. The
  bundled UML cell from PR #417 becomes that copy.

### 2. academy.zam-os.org publishes the cells next to the apps

GitHub Pages serves, read-only:

- `/<app>/` — the app.
- `/<app>/cell.json` — its cell.
- `/catalog.json` — one entry per cell, with the cell's id, title, short
  description, language, version, app URL, cell URL, and the SHA-256 of
  `cell.json`.

This is the first piece of the central learning-content server: static
public content, versioned in git, contributed through reviewed PRs. Anything
that needs accounts, writes or learner data is not part of it. That stays
with ZAM's own databases.

### 3. Publishing a cell there is its release

- **Released means stable** (ADR 2026-08-14 Decisions 8–9). A cell in
  `catalog.json` is released: its item ids, item slugs and the lesson ids
  its cards cite stay stable.
- **Changes follow the release rules.** A replaced item names its
  predecessor with `replaces`, and every change raises the tile version.
- **Before that, anything may change.** Until a cell enters the catalog, it
  may be rebuilt freely, as the UML cell was in PR #417.

### 4. ZAM fetches the catalog only when the learner asks

- **When.** ZAM reads `catalog.json` when the learner opens the Academy list
  (Decision 5) or asks an agent for an academy cell. There is no background
  polling. At those moments, a cell the learner holds is updated when the
  catalog has a newer version. Between them, the bundled copy and its
  existing reconcile apply.
- **How.** Through `safeFetch` only, over https, from the host
  `academy.zam-os.org`. The host is built in; no setting, bridge command or
  MCP argument can change it.
  - The response size is limited.
  - `cell.json` must match the SHA-256 in the catalog.
  - The tile passes the same validation and the same `installKvtTile` as a
    bundled tile, and then enrols as a bundled cell does.
  - A fetched version replaces the bundled one only when it is newer.
- **Policy.** A new corporate policy key, `academy.catalog`, takes `denied`
  or `allowed` and is `denied` in the corporate baseline. Like every policy
  key, no tool argument may write it (ADR 2026-10-08b). When it is denied,
  the Academy list shows the bundled cells only.
- **Team library.** Like any tile change, it refuses the update. The
  administrator installs academy cells with `zam team reinstall-tiles`.

### 5. Studio enrols an academy cell in one click

- **Where.** The import menu of Lern-Karten gets an entry „Aus der ZAM
  Academy“ that opens the Academy list.
- **What each cell shows:**
  - its title and one line of description;
  - „Üben ↗“, which opens the app in the browser;
  - „Aufnehmen“, which enrols the learner.
- **One click is enough.** „Aufnehmen“ enrols at once, because nothing is
  lost: a card the learner does not want is set aside as usual.
- **Afterwards,** the cell appears among the learner's cells in Lern-Karten.
- **Unchanged:** the curriculum wizard stays for school curricula, and
  agents keep `zam_bundled_cells_list` / `zam_bundled_cell_enrol`, which now
  include catalog cells.

The academy apps tell the learner how to get there: open ZAM and ask the
agent, or use the import menu. A link from the web page straight into
Studio is open question 1.

### 6. A web source link is clickable, on every card

This holds for any card whose `source_link` is an http(s) URL, not only
academy cards:

- **Where:**
  - Studio's review, after the answer is revealed;
  - the card editor;
  - the MCP Apps recall panel, through `openLink` when the host offers it;
  - Mobile's review.
- **How it looks:** the host plus „öffnen ↗“. For an academy link it reads
  „Lektion öffnen ↗“.
- **What a click does:** the system browser opens the page.
- **Never automatic.** Only `http:` and `https:` open, and only on the
  learner's click. A local path keeps today's behaviour: the reader for
  files in trusted folders (ADR 2026-10-10).
- The link is library content and is treated as untrusted. Opening it in
  the browser gives the page no access to ZAM.

## Consequences

**Easier**

- A new topic reaches learners without a ZAM release, so one topic per week
  is limited by review, not by release cadence.
- App and cards cannot drift: one repository, one PR, one CI check.
- A learner gets from a card back to the exercise, and from the academy
  into ZAM, without a terminal.
- Every card with a web source becomes clickable, which helps OKF and topic
  imports too.

**Harder**

- **Trusting the catalog means trusting the zam-os GitHub organisation.**
  A compromised repository could publish misleading cards. The cards are
  text only and pass the same validation, but their content could still be
  wrong. Signing is open question 2.
- **Ids freeze sooner.** Once a cell is in the catalog, fixing it means
  `replaces` and version bumps, not rewrites.
- **The release has one more step:** copying the academy cells into ZAM's
  fixtures.
- zam-academy's CI depends on the published `zam-core`, so a tile format
  change in ZAM must be released before academy cells use it.
- Reading the catalog reveals the learner's IP address to GitHub Pages. This
  happens only on the learner's action, and corporate installs keep it off
  by default.

**Unchanged**

- School cells and the curriculum wizard.
- Bundled reconcile, and the administrator's control of a team library.
- The review context and its policy: it still fetches what a link points
  to. For an academy app page this yields little text, and the card's own
  answer carries the grading (open question 3).

## Alternatives considered

- **Keep academy cells only in ZAM's fixtures.** Simple, but every topic
  waits for a release, and app and cards live in two repositories. That is
  how #417 drifted.
- **Let the app export its cards (CSV).** Rejected in the #417 review. The
  import creates a second copy of the same cards, without fast checks,
  curated distractors or prerequisites.
- **A real content server now.** Accounts, hosting and moderation before
  there are ten topics. The static catalog covers distribution, and a
  server can take over the same URLs later.
- **`?lesson=` instead of `#lesson=`.** It would make every lesson its own
  library topic, all named after the app.
- **A `zam://` link as the only way in.** Desktop has no URL scheme today,
  and it would not reach Mobile or a learner without ZAM installed. It may
  come in addition (open question 1).

## Open questions

1. **„In ZAM aufnehmen“ from the academy page.** Desktop could register a
   `zam://` scheme, with Studio asking for confirmation before enrolling. Is
   that worth a URL handler on every platform?
2. **Signing.** Should `catalog.json` and the cells be signed, with the key
   in ZAM releases, instead of trusting the host?
3. **Grounding the review.** Should each app publish a short text per lesson
   that the review context can read, or is the card's answer enough?
4. **Library topic names.** A topic is named after its key, so the UML app
   reads „Uml“. Should a topic take the catalog's title when a cell names
   that key?
5. **School cells in the catalog.** When a LehrplanPLUS cell gets a training
   app, does it move to zam-academy, and does the catalog later outgrow the
   academy name (for example `content.zam-os.org`)?

## Delivery

Each step can ship on its own:

1. **zam-academy:**
   - `uml/cell.json` as the source of the UML cell;
   - `catalog.json` in the Pages build;
   - CI that installs the cell with `zam-core` and checks every cited
     lesson.
2. **ZAM — clickable web links** (Decision 6): Studio review and editor,
   the MCP Apps panel, Mobile.
3. **ZAM — catalog fetch** (Decision 4): the fetcher, the hash check, the
   `academy.catalog` policy key, install and update.
4. **ZAM — the Academy list in Studio** (Decision 5), with one-click
   enrolment. The agent tools return catalog cells.
5. **Release flow:** copy the academy cells into the fixtures, with a test
   that the bundled copy matches the published version.

PR #417 can merge before these steps. Its cell is the first bundled copy.

## Status history

- 2026-10-19 — Proposed.
