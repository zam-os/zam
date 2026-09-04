---
type: protocol
title: Bridge CLI Protocol
description: zam bridge is the machine-facing JSON fallback transport for agents; responses are always JSON, and the protocol types are the stable contract.
tags:
  - cli
  - bridge
  - agents
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/bridge-protocol.md"
timestamp: 2026-09-03T20:56:17.349Z
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

Outbound HTTP that the bridge performs on a learner's behalf identifies
itself with the release-versioned `ZAM-Content-Studio/<version>`
User-Agent, which every release bumps in step with the package version.

Representative commands: `next` (pull the next queue card), `submit`
(apply a rating; accepts `--response-time-ms` so a rating contributes its
study time — ADR 2026-08-01), `stats-activity` (review activity series),
`add-token` (register a token *and* create the calling user's card — see
[token-card-model.md](token-card-model.md)), `personal-card-update`
(partial update by slug), and `personal-card-publish-revision` (publish
with an explicit `cosmetic` or `material` classification). The destructive
pair `personal-card-remove` / `personal-card-delete` uses a
preview→confirm handshake: without `--confirm` it returns an impact
preview (affected cards, review logs, session steps, agent skills); with
`--confirm` it executes. Assignment create, withdraw, and list commands use
the same JSON-only surface.

Local text-card files use an explicit two-command handshake:
`personal-card-import-file-preview --path <file>` parses an APKG, CSV, or TSV
file and returns its deterministic decks, cards, warnings, action counts, and
`planHash`. `personal-card-import-file-confirm --path <file> --plan-hash
<hash>` reparses and atomically commits that exact plan. Both commands are
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
series. Ratings logged before response-time measurement existed count as
worked cards and contribute no time.

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
learner, then atomically creates the token, that learner's card, requested
prerequisite edges, and existing knowledge-context assignments. Plain shared
or pasted text and URLs use the same confirmation path as quick-capture
drafts.

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
- [Flashcard learning-mode plan](../plans/2026-09-03-flashcard-learning-mode.md)
- Tests: `tests/cli/bridge-handlers.test.ts`, `tests/cli/mcp.test.ts`, `tests/kernel/bundled-cells.test.ts`, `tests/kernel/pull-forward.test.ts`, `tests/kernel/study-settings.test.ts`
- Code: `src/cli/commands/bridge.ts`, `src/cli/bridge-handlers.ts`, `src/bridge/protocol.ts`, `src/kernel/scheduler/study-settings.ts`

- [ADR 2026-07-06a — MCP as the Canonical Agent Transport](../adr/2026-07-06a-mcp-agent-transport-and-surfaces.md)
- [ADR 2026-08-01 — Learning Progress Statistics](../adr/2026-08-01-learning-progress-stats.md)
- [ADR 2026-08-02 — Local Generation Only on Accelerated Hardware](../adr/2026-08-02-foundry-local-and-hardware-classification.md)
- [ADR 2026-08-09 — Free Offline Learning and Anki Interoperability](../adr/2026-08-09-free-offline-learning-and-anki-interoperability.md)
- [Android companion plan](../plans/2026-07-21-android-companion-app.md)
- Code: `src/cli/app.ts`, `src/cli/commands/bridge.ts`, `src/cli/commands/shared/activity.ts`, `src/bridge/protocol.ts`, `src/kernel/analytics/progress.ts`, `src/cli/import/text-file.ts`, `src/cli/open-content/catalog.ts`, `src/cli/open-content/download.ts`, `src/cli/open-content/service.ts`, `src/kernel/import/text-import.ts`, `mobile/src/import.ts`, `mobile/src/main.ts`, `mobile/src/vl-import.ts`, `mobile/src/vision-config.ts`, `mobile/src-tauri/src/vision.rs`
