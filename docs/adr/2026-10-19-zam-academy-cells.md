# ZAM Academy: Cells from academy.zam-os.org, One-Click Enrolment, Links Back to the Lesson

**Status:** Implemented — PR #419 (2026-10-19). Manual checks in the running apps and open questions 1–7 stay open\
**Date:** 2026-10-19\
**Deciders:** Thomas (project owner)\
**Plan:** `docs/plans/2026-10-19-zam-academy-cells.md`, removed at release
0.54.0; read it in the history of zam-os/zam#418 and zam-os/zam#419\
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
  (`src/kernel/library/bundled-cells.ts`).
  - `reconcileInstalledBundledTiles` reinstalls an installed tile whenever
    its recorded version *differs* from the compiled one, by string
    comparison. Studio runs it shortly after start.
  - A team library refuses this; there, `zam team reinstall-tiles`
    reinstalls the compiled tiles.
  - `enrolBundledCell` knows only compiled tiles and throws for any other
    id.
- **Cells are enrolled only for a curriculum place.** That happens in the
  curriculum wizard, the Atlas import and Mobile.
  - `zam-academy` is not a curriculum provider, and should not be, because
    it is not a school curriculum. So an academy cell has no learner path
    in Studio or Mobile today.
  - Lern-Karten lists the cells the learner already holds.
  - Agents can enrol any bundled cell (`zam_bundled_cell_enrol`).
  - Enrolment creates every card due now, and no command leaves a cell
    again; setting aside works per card.
- **How a source link is shown:**
  - Desktop review shows `source_link` as code text after the answer is
    revealed (`desktop/src/main.ts`, the reveal rows).
  - The MCP Apps recall panel stores the link and does not show it.
  - Mobile's review already opens a web source („Quelle öffnen“).
  - The Atlas opens a web page on the learner's click (ADR 2026-10-14
    Decision 4), and the OKF and knowledge-map panels use the host's
    `openLink`.
- **The review context fetches http(s) links** through `safeFetch` and turns
  the HTML into text. For a single-page app, that text is little more than
  the page title.
  - `safeFetch` follows up to five redirects to any public host.
  - The corporate policy keys of ADR 2026-10-08b D6 (such as
    `sourceLinks.remoteFetch`) are proposed only. D1–D5 shipped (#399);
    no code reads a managed policy file yet.

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
  names an existing lesson of that app. Each app's own test pins its lesson
  ids (for UML, `uml/tests/uml-learning-app.test.ts`), so renaming a lesson
  fails there first.
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

### 3. A cell is released by its first publication, in either place

- **Released by whichever comes first.** A cell is released the first time
  it is published: in `catalog.json`, or in a ZAM release that bundles it.
  From then on, learners may hold review history on its items.
- **Released means stable** (ADR 2026-08-14 Decisions 8–9). Its item ids,
  item slugs and the lesson ids its cards cite stay stable.
- **Changes follow the release rules.** A replaced item names its
  predecessor with `replaces`, so the learner's evidence moves with it, and
  every change raises the tile version. Mastery never moves across an
  uncertain match.
- **Before that, anything may change.** Until its first publication, a cell
  may be rebuilt freely, as the UML cell was in PR #417. Once #417 is part
  of a ZAM release, the UML cell is released.

### 4. ZAM reads the catalog on the learner's action, and installs only what the learner takes

- **Reading writes nothing.** Opening the Academy list (Decision 5) reads
  `catalog.json` and installs nothing. There is no background polling.
- **Only the learner goes to the network; agents never do.** A tool call
  is not the learner's action, since an injected agent can make it too
  (ADR 2026-10-08b).
  - Studio and the CLI keep the last catalog the learner checked, and the
    cells fetched with it, in a machine-local cache under `~/.zam`. The
    cache is not in the library database.
  - `zam_bundled_cells_list` lists bundled cells and the cached catalog's
    cells.
  - `zam_bundled_cell_enrol` enrols any of them, but never fetches.
- **Two learner actions install:**
  - **„Aufnehmen“** enrols. On a cell the release does not bundle, Studio
    first fetches the cell, then runs `installKvtTile` on it and
    materialises cards for its in-scope atoms. `enrolBundledCell` keeps
    taking a cell id and resolves an id that is not bundled through the
    cache.
  - **„Aktualisieren“** updates one held cell whose catalog version is
    newer. Lern-Karten offers it on the cell's row once the learner has
    checked, either with the row's „Auf Aktualisierung prüfen“ or by opening
    the Academy list.
- **Releases still deliver fixes on their own.** Studio's reconcile keeps
  installing bundled copies, but never downgrades. Versions compare as
  dotted numbers (`2026.10.10` is newer than `2026.10.9`), and a recorded
  version ahead of the compiled one stays.
- **How it fetches:**
  - Only through `safeFetch`, over https, from `https://academy.zam-os.org`.
    The origin is built in; no setting, bridge command or MCP argument can
    change it.
  - A cell URL in the catalog is a path resolved against that origin.
  - A redirect that leaves the origin fails, at any hop.
  - The response size is limited.
  - The SHA-256 in the catalog binds `cell.json` to its catalog entry, so a
    split or stale fetch fails. It does not authenticate the publisher:
    trust is the pinned origin over TLS, plus the same tile validation a
    bundled tile passes.
- **Policy.** With no policy file, a personal library fetches on the
  learner's action. `academy.catalog: denied` belongs in the corporate
  baseline. It takes effect once ADR 2026-10-08b D6's policy reader exists;
  until then a corporate install cannot switch the catalog off. No tool
  argument writes the key, and the learner is never sent to edit it.
- **Team libraries.** They refuse catalog installs and stay on the bundled
  snapshot of their ZAM build. `zam team reinstall-tiles` installs that
  snapshot. An administrator command that installs from the catalog is
  open question 6.

### 5. Studio enrols an academy cell in one click

- **Where.** The import menu of Lern-Karten gets an entry „Aus der ZAM
  Academy“ that opens the Academy list.
- **What each cell shows:**
  - its title and one line of description;
  - „Üben ↗“, which opens the app in the browser;
  - „Aufnehmen“, which enrols the learner.
- **One click is enough.** „Aufnehmen“ enrols at once, as the Atlas
  import already does.
  - The row says beforehand how many cards become due, for example „26
    Karten“, and which version it installs.
  - On click the button turns into „Aufgenommen“ and is disabled.
- **Afterwards,** the cell appears among the learner's cells in Lern-Karten,
  with „Aktualisieren“ when a newer version is known (Decision 4).
- **Unchanged:**
  - The curriculum wizard, the Atlas import and Mobile keep enrolling for a
    curriculum place.
  - Agents keep `zam_bundled_cells_list` and `zam_bundled_cell_enrol`. The
    enrol tool now also takes a cached catalog id (Decision 4).
- **Mobile gets the Academy list later** (Delivery step 7).

The academy apps tell the learner how to get there: use the import menu, or
open ZAM and ask the agent. For a topic the release does not bundle yet,
the agent can enrol it only after the learner has opened the Academy list
once. A link from the web page straight into Studio is open question 1.

### 6. A web source link is clickable, on every card

This holds for any card whose `source_link` is an http(s) URL, not only
academy cards:

- **Where:** Desktop and the panel catch up with Mobile, which already does
  this:
  - Studio's review, after the answer is revealed;
  - the card editor;
  - the MCP Apps recall panel, through `openLink` when the host offers it.
    It does not show the link at all today.
  - Mobile's review, whose label follows the same rule.
- **How it looks:**
  - The host and the path, shortened if long, plus ↗. For a Wikipedia card,
    the article name is the useful part.
  - The host is shown in its ASCII (punycode) form, because the link is
    untrusted library content and a look-alike host must not pass as a
    known one.
  - „Lektion öffnen ↗“ only when the parsed host is `academy.zam-os.org`.
  - The full URL stays visible on hover or long-press.
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
- Reading the catalog reveals the learner's IP address to GitHub Pages, but
  only on the learner's action.
- **Corporate installs cannot switch the catalog off** until the D6 policy
  reader of ADR 2026-10-08b ships.
- **A learner who never checks gets fixes only with ZAM releases** (through
  the bundled copy). That is the price of no background polling.
- **An agent cannot reach a brand-new topic on its own.** It can enrol a
  topic the release does not bundle only after the learner has checked the
  catalog once.

**Unchanged**

- School cells and the curriculum wizard.
- Bundled reconcile, except that it no longer downgrades, and the
  administrator's control of a team library.
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
6. **Team libraries and the catalog.** Should an administrator command
   install academy cells from the catalog, or do team libraries wait for
   ZAM releases?
7. **Leaving a cell.** No command leaves a cell today; setting aside works
   per card. Does one-click enrolment need a one-click way out?

## Delivery

Each step can ship on its own:

1. **zam-academy,** right after #417 merges, so `zam-os/zam` does not stay
   the cell's de-facto source:
   - `uml/cell.json` as the source of the UML cell;
   - `catalog.json` in the Pages build;
   - CI that installs the cell with `zam-core` and checks every cited
     lesson;
   - the README changed to say where the cell now lives.
2. **ZAM — clickable web links** (Decision 6): Studio review and editor,
   the MCP Apps panel, Mobile's label.
3. **ZAM — reconcile never downgrades** (Decision 4): dotted-number version
   comparison. This is needed before anything installs from the catalog.
4. **ZAM — catalog read and install** (Decision 4):
   - the origin-pinned fetcher (every redirect hop), the hash check, and
     cell paths resolved against the origin;
   - the machine-local catalog cache, and agent tools that read only that;
   - catalog-only enrolment through `enrolBundledCell`;
   - „Aktualisieren“ for one held cell;
   - the refusal in team libraries.
   - The `academy.catalog` key is only recorded here; it is enforced when
     D6 lands.
5. **ZAM — the Academy list in Studio** (Decision 5): one-click enrolment,
   the card count, and the update check on the held cell's row.
6. **Release flow:**
   - Copy the academy cells into `tests/fixtures/curriculum/` as
     `zam-academy-<app>-kvt.json`, so `scripts/update-bundled-cells-imports.mjs`
     picks them up like the UML cell.
   - The copy records the version and SHA-256 it was taken from. A test
     checks the bundled copy against that record, not against the live
     catalog, which moves weekly by design.
7. **Mobile — the Academy list** (Decision 5), on the same catalog rules.

PR #417 can merge before these steps. Its cell is the first bundled copy,
and Decision 3 makes it released from that ZAM release on.

## Status history

- 2026-10-19 — Proposed.
- 2026-10-19 — Reviewed by Grok and Gemini on PR #418. Decision 4 was
  rewritten:
  - reading installs nothing;
  - the learner installs with „Aufnehmen“ or „Aktualisieren“;
  - reconcile never downgrades;
  - catalog-only enrolment is named;
  - the origin is pinned across redirects;
  - the policy key waits for D6;
  - team libraries stay on the release snapshot.

  Decision 5 shows the card count instead of claiming nothing is lost.
  Decision 6 keeps the full URL visible and names the panel and Mobile. The
  Context now matches the code. Open questions 6 and 7 are added.
- 2026-10-19 — Reviewed by MiMo on PR #418.
  - Decision 3: a cell is released by its first publication, in the catalog
    or in a ZAM release.
  - Decision 4: agent tools never go to the network; they read a
    machine-local cache of the learner's last check.
  - Decision 5: the row shows the version, and Mobile's list is Delivery
    step 7.
  - Decision 6: the label shows host and path, with the host in punycode.
  - The release test checks the recorded copy, not the live catalog.
- 2026-10-19 — Implemented on `feat/zam-academy-cells` (PR #419): Phases 2–8 of the plan. Phase 1 was zam-os/zam-academy#1.
