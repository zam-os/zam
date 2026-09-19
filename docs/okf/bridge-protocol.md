---
type: protocol
title: Bridge CLI Protocol
description: zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
tags:
  - cli
  - bridge
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/bridge-protocol.md"
timestamp: 2026-09-19T12:05:00.000Z
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

A photo or screenshot from the camera or gallery is downscaled on-device
and sent through the native Android command to the library's configured
HTTPS cloud-vision endpoint. The vision model returns one or more
bridge-token-shaped drafts; each stays editable and requires confirmation
before the same atomic import runs. The token records `vision:<model>`
provenance. Image import is online-only and unavailable when cloud vision
is not configured.

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

# Citations
- [ADR 2026-08-14 — Central Learning Atoms and Identity](../adr/2026-08-14-central-learning-atoms-and-identity.md)
- [ADR 2026-08-14b — Published Atom Identity and Alignment](../adr/2026-08-14b-published-atom-identity-and-alignment.md)
- [ADR 2026-09-04 — Team Library on PostgreSQL with Entra](../adr/2026-09-04-team-library-postgres-entra-pilot.md)
- [Flashcard quality contract — PR #321](https://github.com/zam-os/zam/pull/321)
- Tests: `tests/cli/bridge-handlers.test.ts`, `tests/cli/shared-db.test.ts`, `tests/integration/bridge-serve-mode.test.ts`, `tests/cli/mcp.test.ts`, `tests/cli/bridge-host-rotation.test.ts`, `tests/cli/bridge-library-switch.test.ts`, `tests/kernel/library-switch-credentials.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/pull-forward.test.ts`, `tests/kernel/study-settings.test.ts`, `tests/kernel/publication.test.ts`
- Code: `src/cli/commands/bridge.ts`, `src/cli/commands/shared/db.ts`, `src/cli/bridge-handlers.ts`, `src/cli/db/library-switch.ts`, `src/cli/db/entra-cli.ts`, `src/kernel/credentials.ts`, `src/bridge/protocol.ts`, `src/kernel/scheduler/study-settings.ts`

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-08-01 — Learning Progress Statistics](../adr/2026-08-01-learning-progress-stats.md)
- [ADR 2026-09-15 — Idle-Aware Study Time](../adr/2026-09-15-idle-aware-study-time.md)
- [ADR 2026-08-02 — Local Generation Only on Accelerated Hardware](../adr/2026-08-02-foundry-local-and-hardware-classification.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/cli/app.ts`, `src/cli/commands/bridge.ts`, `src/cli/commands/shared/db.ts`, `src/cli/commands/shared/activity.ts`, `src/bridge/protocol.ts`, `src/kernel/analytics/progress.ts`, `src/kernel/analytics/learning-clock.ts`, `src/cli/import/text-file.ts`, `src/cli/open-content/catalog.ts`, `src/cli/open-content/download.ts`, `src/cli/open-content/service.ts`, `src/kernel/import/text-import.ts`, `mobile/src/import.ts`, `mobile/src/main.ts`, `mobile/src/vl-import.ts`, `mobile/src/vision-config.ts`, `mobile/src-tauri/src/vision.rs`