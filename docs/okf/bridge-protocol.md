---
type: protocol
title: Bridge CLI Protocol
description: zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
tags:
  - cli
  - bridge
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/bridge-protocol.md"
timestamp: 2026-10-19T16:00:00.000Z
---

`zam bridge <command>` is ZAM's machine-facing CLI transport: an agent
shells out, passes flags, and reads a JSON response from stdout. It is the
**fallback** transport — MCP is the preferred connection (see
[mcp-surfaces.md](mcp-surfaces.md)) — but it remains fully supported and
is what embedded surfaces (for example the desktop app's bundled runtime)
drive.

The hard contract:

- **JSON only.** Every bridge response is JSON, including errors — all
  action output goes through the `jsonOut`/`jsonError` helpers in
  `src/cli/commands/bridge.ts`; a stray `console.log` is a bug. Commander
  errors that occur before an action runs, such as an unknown flag or a
  missing required option, are intercepted by `src/cli/app.ts` and emitted
  through the same `{"error":"..."}` stdout envelope with a non-zero exit
  status and no plain-text stderr. (This is stricter than the `--json` flag
  other commands offer.)
- **`src/bridge/protocol.ts` types are the stable contract.** Agents,
  desktop panels, and the mobile companion's additive import program
  against these shapes; breaking them breaks external callers.

# Connection lifetime

A standalone `zam bridge <command>` invocation still owns one database handle
and closes it when that command finishes. The Desktop instead keeps
`zam bridge serve --stdin` alive: this host opens its database lazily on the
first database-backed request, injects the same handle into every later
Commander action, and closes it after stdin ends and the final queued request
finishes. Failed open attempts are forgotten so a later request can retry.
The commands that change the configured library — `server-db-connect`,
`team-db-connect`, `library-restore`, `team-db-disconnect` — retire the old
handle after they succeed, ensuring the next status/dashboard request opens
the newly selected library (`retiresPersistentDatabaseHost`; a source-scan
test keeps that list honest).

The injection is scoped to one asynchronous command execution. It is not a
global connection cache, and concurrent in-process callers cannot borrow one
another's database. This keeps the JSON protocol identical while removing a
connection and schema-version round trip from each warm Desktop interaction.

The persistent bridge answers one request at a time. A command that waits on
a model for a long time would hold up every other Studio request, so the
Desktop runs an allowlisted few in a short-lived CLI process beside it
(`execute_zam_bridge_background`): `choice-prepare`,
`material-import-analyze` and `model-refresh-capabilities`. That process
shares only the library database; its stderr is not streamed to the WebView.

`model-refresh-capabilities` asks cloud providers again about models whose
detected capabilities are out of date: never probed, probed before ZAM's
capability list last grew (`file`, 0.47.0), or more than 30 days ago. With
`--check` it only counts those rows and reads no network; the Desktop runs
that once per session after the dashboard loads, and starts the background
refresh only when the count is above zero. Local and agent models are never
asked automatically — starting a local runtime is expensive — and keep the
manual re-check (`model-reprobe`). The refresh reads catalogue metadata only,
calls no model, and only widens: a capability the provider now declares for
that exact model id is added and switched on, nothing is removed, and a row
the catalogue does not list stays as it was and due.

A windowed Desktop swallows the serve process's stderr, so the process keeps
a diagnostics log at `~/.zam/desktop-bridge.log`: one line per start with the
resolved home directory, one per failed request — a thrown error, or a
response that reports `success: false` / `ok: false` with an `error` string —
and one per request that took 30 seconds or longer. A line carries the
command name, the duration and the error; arguments are never written,
because they carry learner content, and every line but the start line goes
through the redactor that hides keys and tokens a provider's error may echo. A `false` without an `error` string is a
status (for example `backup-db` on a remote library) and is not logged. The
Desktop's spawn log sits beside it as `desktop-bridge.rust.log`.

Outbound HTTP that the bridge performs on a learner's behalf identifies
itself with the release-versioned `ZAM-Content-Studio/<version>`
User-Agent, which every release bumps in step with the package version.

Representative commands: `next` (pull the next queue card), `admit-review`
(record that a card is shown: refuses a same-atom sibling already presented
on the learner's local day and any unpublished card, and returns the
`attemptId` for the following submit), `submit` (apply a rating; accepts
`--response-time-ms` so a rating contributes its study time — ADR
2026-08-01; Studio always sends a number from the idle-aware clock in
ADR 2026-09-15, and `--attempt-id` so a retried submit is one review: the result
carries `attemptId` and `applied: false` on a replay; `--record-only
--reason <text>` logs assisted user work without a rating and answers
`recordedOnly`/`replayed`; a completed session still accepts a rating of its
own work, while record-only steps need an open session), `stats-activity`
(review activity series),
`add-token` (register a **draft** token *and* create the calling user's card —
see [token-card-model.md](token-card-model.md)), `list-drafts`,
`personal-card-update` (partial update by slug), and
`personal-card-publish-revision` (the publish gate: structural checks then an
explicit `cosmetic` or `material` classification). The destructive pair
`personal-card-remove` / `personal-card-delete` uses a preview→confirm
handshake: without `--confirm` it returns an impact preview (affected cards,
review logs, session steps, agent skills); with `--confirm` it executes.
Assignment create, withdraw, and list commands use the same JSON-only surface;
`create-assignment` writes the assignment row only — the assignee's card is
created and bound by the assignee's own next queue build (see
[token-card-model.md](token-card-model.md)).
`library-topics-list` lists the library's topics with the caller's own
coverage and writes nothing; `library-topic-start --key <key>` creates the
caller's cards for one topic and writes nothing else (see
[token-card-model.md](token-card-model.md)).

Local text-card files use an explicit two-command handshake:
`personal-card-import-file-preview --path <file>` parses an APKG, CSV, or TSV
file and returns its deterministic decks, cards, warnings, action counts, and
`planHash`. `personal-card-import-file-confirm --path <file> --plan-hash
<hash>` reparses and atomically commits that exact plan; `--apply-published`
additionally applies changed source wording onto already published tokens as
a material revision, which a plain re-import never does. Both commands are
model-free and network-free. See
[local-card-file-import.md](local-card-file-import.md) for formats, security,
and re-import semantics.

The curated library adds a second preview/confirm handshake:
`open-content-list` returns the installed, explicitly licensed catalog and its
filters; `open-content-preview --id <catalog-id>` downloads or reuses the
pinned artifact, verifies its size and SHA-256 digest, and returns the normal
import preview; `open-content-confirm --id <catalog-id> --plan-hash <hash>`
re-verifies and atomically commits that exact plan. Listing is local. Preview
may make one allowlisted HTTPS download, while confirmation works from the
verified cache. See [open-content-library.md](open-content-library.md).

`stats-activity` takes `--period day|week|month` and `--window <n>`. The
window counts **periods, not days**: `--period week --window 12` returns the
current ISO week plus the eleven before it. Buckets are formed in the
learner's local time and keyed `2026-08-01`, `2026-W31`, `2026-08`; each
carries `reviewedCards` and `studyTimeMs`. Study time sums
`review_logs.response_time_ms` with each rating clamped to ten minutes
(`STUDY_TIME_CAP_MS`) so a card left open on a locked phone cannot swamp the
series. Studio and the Recall card measure active time with a one-minute idle
pause and a two-minute cap per follow-up (ADR 2026-09-15). Ratings logged
before response-time measurement existed count as worked cards and contribute
no time.

# Topic import

The topic import ([ADR 2026-10-14](../adr/2026-10-14-topic-import-and-source-provenance.md))
turns a topic in the learner's words, with its context, into cards. It
writes no file:

- `topic-outline --title <topic> [--context <text>] [--path <json>]
  [--place <json>]` proposes the next level of subtopics. The context holds
  what the topic is needed for, what to focus on and what the learner
  already knows: it narrows the topic and says where to start, but never
  becomes content, and the model keeps to what the topic names. Without a
  context the model starts from the topic's foundations. A subtopic's label
  never names the field the learner already knows. `--place` names the
  atlas place the cards will land at, root first, on a line of its own, so
  the model never reads it as prior knowledge. A name longer than 200
  characters is refused before any model call. Each subtopic may carry a
  `lookupTerm`: the Wikipedia article the model names for reading it up.
- `topic-cards --title <topic> [--context <text>] [--path <json>] [--place
  <json>] --topic <json>` drafts cards for one kept subtopic, as a preview:
  one point per card, or one overview card that lists the names of a
  complete set. A counterpart in the field the learner knows appears only
  as a brief bridge on a single card. The cards cite no source: their
  knowledge is the model's world knowledge. A `lookupTerm` in `--topic`
  becomes every card's `lookup_term`.
- `topic-source --title <topic>` records the import as one source row,
  `zam-topic:<ULID>`, with the title, the date and the learner. The confirm
  (`personal-source-confirm-import --sourceId`) links every card to it,
  stores each proposal's `lookup_term`, and without `--place-region` puts
  the units it created on the world planet (Decision 5), reported as
  `placed`. Where nobody may place them, their `zam-topic:` source keeps
  them world knowledge. A retry after a failed placement also places the
  cards it finds already written, as long as no lens has placed them; a
  linked duplicate with a place of its own keeps it.

The goal import's `goal-decompose`, `goal-topic-cards` and `goal-create`
are retired.

# Material import

Learning cards from photos, PDFs and typed notes (see [material-import.md](material-import.md))
move through a staged batch that only the learner's confirm turns into
library rows:

- `material-import-stage --file <set.json> [--origin studio|harness]
  [--harness <name>]` validates a proposal set and stages it in
  `~/.zam/pending-imports/`; `material-import-pending` lists waiting batches
  (expired ones, after seven days, are pruned); `material-import-discard
  --id <id>` drops one without writing.
- `material-import-analyze --file <path>… [--pages <range>]` reads up to ten
  photos or one PDF with the connected model and stages the result with
  origin `studio`; `--text <notes> [--title <name>]` sends typed notes to the
  first text model instead. `--place-region <key> [--place-lens <kind>]`
  starts the import at a region of the knowledge atlas. A refusal the learner can act on — no image or file model,
  HEIC that cannot be converted, a mixed or oversized selection, an answer
  that does not fit the contract — comes back as `{ success: false, code,
  message }` rather than an `error`, so a surface can explain it by `code`.
  Progress goes to stderr as `{"type":"material-analyze-progress",...}`.
  A success names the model that read the pages (`model`) and every model
  they were sent to (`sentTo`), since a failing first model hands the request
  on; the batch keeps both, and `material-import-review` returns them as
  `readBy` and `sentTo`. `material-import-models` names the models photos and
  PDFs would go to first.
- `material-import-review --id <id>` matches the proposals against the library
  and the bundled cells, returns the rows with their presets, area groups and
  earlier imports of the same files, and stores those rows in the batch;
  `material-import-confirm --id <id> --decisions <json> [--areas <json>]
  [--variants <json>]` applies the decisions to exactly those rows in one
  transaction and retires the batch; `--variants` lists the proposal rows
  whose "instead of" the learner ticked. Bad `--decisions`, `--areas` or
  `--variants` JSON is reported as JSON.
- `material-import-file-preview --id <id> --file <n>` returns a small image of
  a staged file for the review list, only for files the batch names;
  `material-import-areas` lists the areas in use and the cell subject codes.
- `material-import-bonus-list [--limit <n>]` lists the caller's kept Bonus
  items; `material-import-bonus-take --token <id>` creates the caller's card
  for one, and refuses an item that is not from the caller's own imports.

# Knowledge atlas

The knowledge atlas ([ADR 2026-10-13](../adr/2026-10-13-knowledge-atlas.md))
reads and writes through these commands. Only `atlas-read` and
`atlas-revision` are in `STUDIO_BRIDGE_COMMANDS`, for the read-only atlas
panel; no write is, and no
argument takes coordinates: only settle places land.

- `atlas-read [--lens <kind>] [--planet <planet>] [--time-zone <iana>]`
  returns one learner's map of one lens: regions, islands, land, units with their condition,
  red threads, the learner's own due counts and the home region. It
  writes nothing; land not stored yet is planned in memory and marked
  provisional. A due count is what a region review would show now, by the
  queue's rules: a card waiting for its next short step, a blocked or buried
  card, and an atom's further items on a day one of them was shown are not
  counted, although the condition still shows them. `emblems` holds each
  Sinnbild once by subject key, and every region and unit that has one names
  it in `emblem`; a leaf region without its own names its first unit's. A
  region's `emblemSubject` says where its own is written: a Fach's in a world
  lens is the subject's, `subject:<key>`, shared by every world lens, and any
  other region's is `region:<lens>:<region key>`. `ownPlanet` and `lenses` say
  which planets and lenses the library shows. A library holds world knowledge
  (Weltwissen and Schule) and one planet of its own: Privat (Leben) on a
  personal library, Firma (Produkte, and Unternehmen once a curator made it)
  on a team library. `--planet` alone opens that planet's last or primary
  lens; a lens of the other planet is refused. Each read places only the
  units of the lens's planet: a published unit is world knowledge, an own
  unit takes the planet of the lens it is placed in, and an own unit nobody
  placed is world knowledge only where a world rule covers it (a Weltwissen
  alias, a curriculum link, a variant of a world unit); otherwise it lands on
  the own planet. `threads` holds every thread with an end on the map:
  `from` is the dependent end (it builds on, uses, consumes the interface of,
  or is a special case of `to`), `kind` is `voraussetzung`, `nutzt`,
  `schnittstelle`, `ist-ein` or `verbindung`, `scope` is `shared` (a
  prerequisite or the library's connection) or `personal` (the learner's
  own), and a connection carries its `id` and `note`. A learner's own
  thread that the library has too is drawn once, as the learner's: its `id`
  and `note` are theirs, and `alsoShared` is true. An end on the
  library's other planet stays in the thread and is named in `portals`, by
  title and planet; the Studio draws it as a portal. A variant stands in at
  that end as it does on its own planet: the learner's chosen one, or the
  library's while the learner holds no card of the published unit.
- `atlas-connect --from <key> --to <key> --kind <kind> [--note <text>]
  [--scope personal|shared] [--from-studio]` spins a red thread. It is the
  learner's own by default, learning state that never feeds blocking.
  `shared` writes the library's and needs the right to write knowledge
  (`not-curator` otherwise); a shared `voraussetzung` is refused, since it
  belongs in the prerequisite tables (`zam_link_prereq`). A thread never runs
  from world knowledge to the own planet; a `verbindung` turns around instead
  (`swapped`). The same thread again returns `created: false`, and a new
  note replaces the old one.
- `atlas-disconnect --id <id>` cuts the learner's own thread, or the
  library's with the right to write knowledge.
- Both refuse with `{ error, code }`, so a surface can explain each case:
  `invalid-kind`, `same-unit`, `unknown-unit`, `world-to-own`,
  `shared-prerequisite`, `not-curator`, `note-too-long` or
  `unknown-connection`. `link-prereq` and `zam token prereq` keep the same
  planet rule: a prerequisite from world knowledge to a Firma or Privat unit
  is refused.
- `atlas-settle [--lens <kind>]` stores the land, and refuses with
  `not-curator` when PostgreSQL's grants say this connection may not write
  knowledge. Land no unit reaches any more goes back to the sea: a region
  left without units keeps no reserve, and an island left without units
  disappears. Every settle result counts them as `landRemoved` and
  `islandsRemoved`, beside `regionsCreated`, `islandsWritten` and
  `landWritten`.
- `atlas-prefs [--lens <kind>] [--home <regionKey>] [--show-new on|off]`
  stores the learner's lens, home region and *Neue Inhalte zeigen*; turning
  the last on installs the cells of the learner's school year, which enrols
  nobody, and reports them as `cellsInstalled`.
- `atlas-place --region <key> [--lens <kind>]` names what an import at a
  region needs: its path, the levels below it, the learner's published units
  there and the bundled cells, with `wizard` true where no cell covers it.
- `atlas-take (--unit <key>… | --region <key> [--lens <kind>])` creates cards
  for sketched units, never for declined ones.
- `atlas-planet [--own firma|privat]` reads the library's own planet, or
  sets it ("Diese Bibliothek gehört zu einer Firma"); unset, a team library
  is Firma and a personal one Privat. Setting it refuses with `not-curator`
  without the right to write knowledge. Lenses of the other planet stay
  stored but are no longer shown.
- `atlas-move-planet --planet <planet> (--unit <key>… | --region <key>
  [--lens <kind>])` moves own units to world knowledge or to the library's
  own planet, where that planet's primary lens puts them, and drops their
  placements on the other planet. Published units are reported as
  `skipped`: they stay world knowledge. A unit that a directed thread or a
  prerequisite holds stays where it is and is reported in `held`, with the
  unit at the thread's other end as `by`: moved, world knowledge would
  depend on a Firma or Privat unit. Units moved together keep their threads
  together. Without the right to write knowledge it refuses with
  `not-curator`.
- `atlas-lens-edit --lens <kind> --edits <json>` applies edits to one lens
  in one transaction, then stores the land: `create-region`,
  `rename-region`, `reorder-region`, `move-region` (below a region of the
  same level as its parent), `remove-region` (its units fall back to the
  lens's rules), `set-alias`, `remove-alias` and `place`. A world lens never
  moves the published map: it takes additions, removes only regions the
  library made itself (a seed region is refused as `world-structure`, one a
  published unit sits in as `published-unit`), takes aliases for the
  library's own units only, and places no published unit. A move or
  removal clears the land of the regions it
  touches, and the settle that follows lays it out again. A batch after
  which world knowledge would depend on a Firma or Privat unit, through a
  placement, a removed region or an alias, is refused as `held-by-thread`
  and changes nothing. Refusals carry a `code`.
- `atlas-lens-propose --lens <kind> --proposal <json>` stores one pending
  replacement for an own-planet lens from one named source:
  `{source, regions: [{key, name, parent}], aliases?, members?}`. Nothing
  changes until `atlas-lens-accept --lens <kind> [--reject]`, which a
  curator gives in the Studio: accepting replaces the lens's order, aliases,
  placements and land, and the lens follows that source. No history is kept.
- `atlas-lens-stale --lens <kind> --stale on|off [--note <text>]` records
  whether an own-planet lens still fits its source; a world lens has none.
- `atlas-lens-create --kind <slug> --name <name> --levels <a,b,…>
  [--colour-level <n>]` makes a custom lens on the library's own planet: its
  own kind (a slug of 2 to 40 lower-case letters, digits and hyphens that is
  no built-in lens's), a name, and one to five level names, the islands
  first. The colour level defaults to the second level, or the only one. It
  starts empty and takes edits, aliases and proposals like any own-planet
  lens, and every `--lens` option then accepts its kind. Refusals:
  `bad-lens`, `lens-exists`.
- `atlas-lens-remove --lens <kind>` removes a custom lens with its regions,
  aliases, placements and land; its units keep their places in every other
  lens. A built-in lens is refused as `not-custom`, an unknown one as
  `unknown-lens`.
- `atlas-read` returns `curation` for the lens: its `source`, `stale` with
  the note, and a pending `proposal`. Curators see both in the Studio.
- `atlas-revision` returns a fingerprint of what the atlas shows, one
  statement over the atlas tables, the caller's threads, Sinnbilder and
  cards. The Studio polls it every 10 s while the map is on screen, and on
  focus, and reads the map again when it changes.

  Each of these writes needs the right to write knowledge and refuses with
  `not-curator` otherwise.
- `atlas-variant --stands-for <key> (--variant <key> | --undo)` lets a unit
  stand in for a published one, or undoes it; with `--library` a curator
  sets or clears the library's variant.
- `get-review` and `get-reviews` take `--atlas-region <key> [--atlas-lens
  <kind>]`: only that region's due cards, no new ones. A variant counts
  where the map shows it, on its published unit's hex.
  `get-review --atlas-practice-since <iso>` goes through the region again
  although nothing is due: when no card is due, it pulls forward the
  practised card due soonest that was not answered since that time, one card
  per call and one item per atom a day.
- `atlas-emblem-set --subject <key> (--svg <svg> | --glyph <text>) [--scope
  auto|personal|shared] [--from-studio]` stores a Sinnbild: the validator's
  re-serialisation, never the input. A glyph alone becomes a Sinnbild of its
  own. `auto` writes the library's when none exists and the connection may
  write knowledge, the learner's own otherwise; `shared` without that right
  refuses with `not-curator`.
- `atlas-emblem-clear --subject <key> [--shared]` removes the learner's own,
  or with `--shared` the library's.
- `atlas-emblem-draw --subject <key> [--scope …]` lets the first text model
  draw one from the subject's title and path, validates and stores it; a
  refusal comes as `{success: false, code}` with `no-text-model`,
  `model-failed` or `invalid-answer`.
- `get-review --media` also returns the card's unit Sinnbild as `emblem`,
  and `readUp` for a world unit (ADR 2026-10-14, Decision 4): `{kind:
  "source", url}` for a web source, else `{kind: "search", term,
  language}`, which the Studio turns into a Wikipedia search. Firma and
  Privat units get `null`. `atlas-read` gives every unit of a world lens its
  `readUp`, and `personal-card-list` every card's.
- `personal-source-confirm-import` takes `--place-region <key>
  [--place-lens <kind>]`: the units the import created land at that region,
  each proposal's `placeBelow` naming the levels below it (the last name on
  the deepest level). The topic import started at a region passes it.
- `graph3d-feature [--enable|--disable]` reads or sets this machine's switch
  for the 3D learning graph, an alpha since the atlas took its place, in
  `~/.zam/config.json`.

# Library switching

A machine is bound to one library — the local SQLite file, a personal
Turso/sqld server database, or the team library on PostgreSQL (ADR
2026-09-04). `database-status` reports the active `target` (`kind`:
`local`, `turso-*`, `postgres`), the learner id, on the team library the
database `role` the connection runs as, `configured` (which library kind
`credentials.json` binds the machine to, also while a vault-backed token is
locked), and `previous`: the connection a switch kept (`kind`, `location`,
`replacedAt`), never its token. An open failure is not an exit: a team
library that is not provisioned yet answers `success: true, connected: true,
provisioned: false`, any other failure `success: false` with `error` — both
still carry `target`, `configured` and `previous`, so a surface keeps showing
which library the machine is bound to and the way out of it.

Switching keeps the replaced connection so switching back needs no new
token, and a switch that does not verify is undone — the machine is left as
it was:

- `server-db-connect --url --token [--mode] [--replace]` attaches a Turso
  database; `--replace` keeps a configured team library as the previous one,
  without it the command refuses with `LIBRARY_CONFIGURED`.
- `team-db-connect --host --database [--port] [--username] [--auth entra-cli|password]
  [--password] [--replace]` attaches the team library. With Entra the
  username comes from the Azure CLI when omitted; the result carries
  `connected`, `provisioned` (false when the server answered but
  `zam team provision` has not run), `member`, `userId`, `role`, `previous`.
  Not being a member is a state, not an error.
- `entra-login` runs `az login --allow-no-subscriptions` for the learner (the
  browser opens, the command waits) and returns the signed-in `upn` in lower
  case — the Studio's "Sign in with Microsoft".
- `library-restore` makes the previous library current and keeps the one
  being left as the new previous; a verification failure is reported as
  `verifyError` but does not undo the restore.
- `team-db-disconnect` — the Studio's "Learn locally instead" — leaves the
  team library for the previous one when kept, else for the local file, and
  keeps nothing.

The same paths on the CLI are `zam connector setup … --replace`,
`zam connector restore` and `zam connector clear previous`.

# Card text with formulas

Cards may hold segments ([card-text-segments.md](card-text-segments.md));
every field below is optional and additive, and a plain card carries none.

- **Review payloads** (`get-review`, `get-reviews`): `questionSegments`,
  `conceptSegments`, `spokenQuestion`, `spokenConcept`, and per fast check
  `optionSegments` in presented order. Media entries carry `placement`
  (`attached` or `inline`); the attachment strip shows only `attached`. A
  varied question carries the varied segments, with the stored formulas
  spliced back.
- **Writes** take segments as JSON beside the plain flags:
  `personal-card-create`, `personal-card-update` and
  `personal-card-publish-revision` accept `--question-segments` /
  `--concept-segments` (`null` turns a side plain again);
  `add-token` accepts `question_segments` / `concept_segments` in its stdin
  JSON. Invalid segments return the kernel's message, naming the segment.
- **`personal-card-list`** returns `questionSegments` / `conceptSegments`.
- **`card-text-fix --side question|answer --instruction <text>`** (with
  `--segments` or `--text`, optional `--other`) asks the text model to
  correct one side as the learner says and returns `{plain, segments}`; it
  writes nothing.
- **`translate-question --segments <json>`** translates through
  placeholders and returns the translated `segments` too.
- **`bundled-tiles-reconcile --max <n>`** reinstalls installed bundled tiles
  whose version changed (the Studio calls it once per start); a team
  library refuses and points to `zam team reinstall-tiles`.

# Per-learner learning interaction

`study-learning-get` and `study-learning-set` expose the learner's review
interaction as JSON: `flash`, `answer_feedback`, or the currently
scaffolded `answer_variation`, plus independent voice reveal and rating
timeouts. The object is stored under
`study.learning.<encoded-user-id>`; the generic `setting-set` allowlist
cannot write shadow copies of those values. Both timeout flags accept only
integer seconds from 5 through 60.

A caller may pass `--fallback-mode flash|answer_feedback` when reading or
partially updating an as-yet-unset learner. This represents current surface
capability — for example, whether an MCP evaluator is active — and is not
stored by a read. Once a learner chooses a mode, that explicit value wins over
later AI connection or evaluator changes.

# Local AI setup commands

`foundry-local-status` / `foundry-local-setup`, `local-vision-status` /
`local-vision-setup`, and `embedding-status` / `embedding-enable` back the three
Settings cards for machine-local models (see
[local-ai-runtimes.md](local-ai-runtimes.md)). They are the transport, not the
intended learner path — setup is a Settings button.

Each pair separates **inspect** from **act**, and the inspect half is
side-effect free: it never starts a service and never downloads a model, so a
surface may poll it. Status is returned as independent facts (`accelerated`,
`ollamaInstalled`, `serverOnline`, `modelPresent`, `registered`, `usable`)
rather than one verdict, so a caller can name the first thing to fix instead of
the last thing that failed.

The setup halves for text and image are **gated on accelerated hardware** and
return `ok: false` with a reason on a CPU-only machine; `embedding-enable` is
not gated. `foundry-local-status` and `local-llm-hints` additionally report
`hardware`, `acceleration`, and `accelerated` from the system profile so a
surface can disable an action with the reason rather than let it fail.

# Mobile companion import

The mobile companion accepts one `AddTokenRequest`-shaped bridge-token
object from a selected JSON file or an Android share intent. It also accepts
the CLI's snake-case compatibility spellings, always shows an editable
confirmation draft, ignores a payload-supplied user in favor of the paired
learner, then atomically creates the **draft** token, that learner's card,
requested prerequisite edges, and existing knowledge-context assignments.
Plain shared or pasted text and URLs use the same confirmation path as
quick-capture drafts. Editing and publication stay reachable after Save.

Photos and PDFs from the camera, gallery or files go a different way: the
[material import](material-import.md) runs on the device, the connected model
reads them through the native `vision_request` command, and the learner
decides each proposed card in a review list before one transaction writes
them. It is online-only and needs a model that reads images, or PDFs.

# Central learning-field commands

The JSON bridge exposes the commit-controlled field-test path without a file or
network import:

- `bundled-cells-list` reports the four cells and per-learner
  installed/enrolled status; `bundled-cell-enrol <cellId>` performs the
  explicit install-then-enrol workflow idempotently.
- `preconditions-get` and `precondition-assess <atomId> <known|learn>`
  expose finite hard-precondition deferral.
- `pull-forward-candidates` and `pull-forward-execute` implement the
  learner-chosen keep-going step.
- `bonus-candidates-list` and `bonus-atom-enrol` derive and accept a
  prepared out-of-scope atom; accepting creates cards but no rating or score.

`get-review --max-new <n>` lets a repeated-card surface carry its remaining
session admission budget instead of resetting `maxNew` on every call.
`get-reviews --respect-workload [--max-new <n>]` returns a bounded snapshot
using the same workload and `tier1-first` rules as the kernel. Review results
include `atomId`, `tier`, and a normalized `fastCheck` when present.
Structured checks retain the stored editorial question and bypass dynamic
question generation. Every command still writes stdout only through the
bridge's JSON helpers.

# ZAM Academy commands

The learner's academy actions (ADR 2026-10-19), called by Studio:

- `academy-list` reads `https://academy.zam-os.org/catalog.json` and caches
  it and its cells under `~/.zam/academy`. It returns each academy cell with
  `version`, `items`, `appUrl`, `bundled`, `held`, `heldVersion` and
  `newer`. Offline it answers from the cache, with `offline: true`. It writes
  nothing to the library.
- `academy-enrol <cellId>` enrols in the newest version known, bundled or
  from the catalog.
- `academy-update <cellId>` installs the newer catalog version of one held
  cell, and reports `updated`, `from` and `version`.

None of them is in `STUDIO_BRIDGE_COMMANDS` or behind an MCP tool.
`bundled-cells-list` also lists the cells cached by the last check, and
`bundled-cell-enrol` enrols them without fetching.

# Trust and keys

Some commands exist for the desktop's Settings only and are not on the Studio
panel's reviewed list (see [agent-trust-model.md](agent-trust-model.md)):

- `trusted-folders`, `trusted-folder-add --dir`, `trusted-folder-remove
  --dir` and `trusted-folder-add-suggested` manage the folders ZAM may read
  files from.
- `model-confirm-endpoint --id` confirms a model's current URL on this device,
  so its key may be sent there; `model-upsert --confirm-endpoint` does the same
  for the address a Settings save names.
- `model-key-sync --id --on|--off` sets whether a cloud model's key travels to
  the learner's other devices.

`model-list` reports `endpointUnconfirmed` (the URL differs from the one this
device confirmed; its key is held back) and `keySync` for every row. A library
whose token sits in a keychain ZAM cannot read fails to open with
`OS_SECRET_UNAVAILABLE`, distinct from `BITWARDEN_REQUIRED`.

# Citations
- [ADR 2026-10-19 — ZAM Academy Cells](../adr/2026-10-19-zam-academy-cells.md)
- [ADR 2026-10-14b — Formulas, Images and Spoken Text in Cards](../adr/2026-10-14b-card-formulas-images-and-spoken-text.md)
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- [ADR 2026-09-04 — Team Library on PostgreSQL with Entra](../adr/2026-09-04-team-library-postgres-entra-pilot.md)
- [ADR 2026-10-02 — Library Topics](../adr/2026-10-02-library-topics.md)
- [ADR 2026-10-05 — Learning Cards from Photos and Files](../adr/2026-10-05-learning-cards-from-photos-and-files.md)
- [ADR 2026-10-08b — Corporate Deployment Baseline](../adr/2026-10-08b-corporate-deployment-baseline.md)
- [ADR 2026-10-14 — Topic Import, and Where a Unit's Knowledge Comes From](../adr/2026-10-14-topic-import-and-source-provenance.md)
- [Flashcard quality contract — PR #321](https://github.com/zam-os/zam/pull/321)
- Tests: `tests/cli/bridge-handlers.test.ts`, `tests/cli/shared-db.test.ts`, `tests/integration/bridge-serve-mode.test.ts`, `tests/cli/mcp.test.ts`, `tests/cli/bridge-host-rotation.test.ts`, `tests/cli/bridge-serve-log.test.ts`, `tests/cli/bridge-library-switch.test.ts`, `tests/cli/bridge-library-switch-status.test.ts`, `tests/kernel/library-switch-credentials.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/pull-forward.test.ts`, `tests/kernel/study-settings.test.ts`, `tests/kernel/publication.test.ts`, `tests/cli/bridge-library-topics.test.ts`, `tests/cli/bridge-material-import.test.ts`, `tests/cli/capability-refresh.test.ts`, `tests/cli/bridge-model-registry.test.ts`, `tests/cli/topic-outline.test.ts`, `tests/cli/academy.test.ts`
- Code: `src/cli/commands/bridge.ts`, `src/cli/commands/shared/db.ts`, `src/cli/bridge-handlers.ts`, `src/cli/db/library-switch.ts`, `src/cli/db/entra-cli.ts`, `src/kernel/credentials.ts`, `src/bridge/protocol.ts`, `src/kernel/scheduler/study-settings.ts`, `src/cli/material-import.ts`, `src/cli/material-staging.ts`, `src/cli/llm/material-analyze.ts`, `src/cli/llm/capability-refresh.ts`, `src/kernel/import/topic-import.ts`, `src/kernel/atlas/connections.ts`, `src/kernel/atlas/place.ts`, `desktop/src-tauri/src/lib.rs`, `src/cli/academy/handlers.ts`

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-08-01 — Learning Progress Statistics](../adr/2026-08-01-learning-progress-stats.md)
- [ADR 2026-09-15 — Idle-Aware Study Time](../adr/2026-09-15-idle-aware-study-time.md)
- [ADR 2026-08-02 — Local Generation Only on Accelerated Hardware](../adr/2026-08-02-foundry-local-and-hardware-classification.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/cli/app.ts`, `src/cli/commands/bridge.ts`, `src/cli/commands/shared/db.ts`, `src/cli/commands/shared/activity.ts`, `src/bridge/protocol.ts`, `src/kernel/analytics/progress.ts`, `src/kernel/analytics/learning-clock.ts`, `src/cli/import/text-file.ts`, `src/cli/open-content/catalog.ts`, `src/cli/open-content/download.ts`, `src/cli/open-content/service.ts`, `src/kernel/import/text-import.ts`, `mobile/src/import.ts`, `mobile/src/main.ts`, `mobile/src/vl-import.ts`, `mobile/src/vision-config.ts`, `mobile/src-tauri/src/vision.rs`
