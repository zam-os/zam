# Android companion app — definition

Defines the ZAM Android companion app. Read `AGENTS.md` first and work on
exactly the next unchecked phase. Multi-phase work stays on one branch
(`feat/android-app`) and uses one focused commit per completed phase.

## Goal

Run **active-recall sessions away from the desk** — including fully by voice —
against the **same learning state** the CLI/desktop use, and **import learning
content** on the phone. Offline-capable: after setup, a review session must
work with no network and no LLM configured.

The app is a *companion surface*, not a second product: all scheduling,
rating, and blocking behavior comes from the existing TypeScript kernel
(`src/kernel/`). `tests/kernel/fsrs.test.ts` remains the source of truth for
scheduling semantics.

Setup is deliberately effortless: the phone is **configured by scanning a
QR code shown on the desktop** (FR-0). This pairing flow assumes the server
database — "configuration/sync only work with a server DB" is an accepted
trade-off (Thomas, 2026-07-21).

### Field-test users (2026)

Two paired devices, two different learners:

- **Primary learner: a ninth-grade Realschule student (Bavaria)** — planned
  for the Pixel 6 if its optional compatibility run passes, otherwise on a
  Pixel 9 — preparing the 2026/27 school year with the goal of a real grade
  improvement. Previous success with an active-recall tool shows the method
  fits; the app's job is to make it effortless and daily.
- The project owner on a **Pixel 9** (Android 17), the validated reference
  device and current minimum requirement.

Consequences: German-first UX; curriculum content comes from the desktop's
existing LehrplanPLUS import (`lehrplanplus-bayern` — Realschule grade 9 is
fully cataloged, including Mathematik and Physik) and reaches the phone via
sync; pairing must bind a device to **one learner** (FR-0). Success metric
stays the real one — due cards actually reviewed and school results — not
in-app streaks (no-gamification stance, FR-5).

## Platform baseline

- **minSdkVersion 37 / targetSdkVersion 37** (Android 17 "Cinnamon Bun",
  API level 37). The Pixel 9 reference device runs Android 17; the optional
  Pixel 6 compatibility target is on the same API level. No legacy compat
  paths or support-library workarounds are required.
- **Validated minimum hardware = reference device: Google Pixel 9.** The
  complete Phase-0 sync/offline scenario passed on this device. A Pixel 6
  compatibility run is optional: if it passes, the minimum can be lowered
  to the Pixel 6; if not, Pixel 9 remains the requirement. Until then,
  performance and speech behavior must not assume hardware newer than the
  Pixel 9.
- Pixel 6 security support is scheduled to end around 2026-10. A successful
  compatibility run would therefore broaden the field test without changing
  the API-37 baseline.

### Performance budgets (measured on the validated minimum device)

- Cold start → first due card visible: **≤ 2 s**
- Rate card → next prompt rendered: **≤ 150 ms** (LLM work must never block
  the reveal/advance flow — same pipelining stance as ADR 2026-06-27)
- Voice round trip, prompt finished speaking → listening: **≤ 1.5 s**
- Queue build at 20 000 tokens / 5 000 due cards: **≤ 500 ms**
- A 20-minute voice session must not visibly drain the battery (validate
  qualitatively during the field test).

## Functional requirements

### FR-0 Pairing & configuration via desktop QR code

- The desktop Studio gets a "pair mobile device" surface that renders a QR
  code from the machine-local credentials (`~/.zam/credentials.json`): a
  versioned `zam-pair` JSON payload carrying the libsql/Turso database URL,
  an auth token, the desktop's machine-local **LLM role configuration**
  (provider URL plus a key when the selected provider requires one — one scan
  also configures recall quality), and
  optional bootstrap settings (locale, profile).
- First run on Android: scan the code (camera permission), validate the
  payload version, store credentials in app-private storage backed by the
  Android Keystore, run the initial sync, land in the due queue. No manual
  configuration required; manual URL/token entry exists only as a fallback.
- Pairing **requires the server database**: a desktop without Turso/sqld
  configured cannot pair and must say so clearly. Local-only phone setups
  are out of scope by requirement.
- Security: the QR encodes a live, long-lived DB token and, for a keyed cloud
  provider, its LLM API key in clear text. Render it only on explicit user
  action with a shoulder-surfing note. Hiding it after five minutes limits
  screen exposure but does not expire an already captured payload or its
  credentials. This is accepted for the owner-present, two-device field test;
  prefer database-scoped tokens, and later replace the direct-secret transfer
  with short-lived/scoped tokens or a server-mediated pairing handshake.
  Re-pairing replaces stored credentials; a revoked/expired token leads to a
  re-pair prompt, never to silent data loss.
- Pairing binds the device to **one learner**: the payload carries the
  learner's user id, chosen (or created) in the desktop pairing surface.
  Preferred setup for family use: **one server database per learner**, so a
  teenager's learning data stays their own — the QR flow is identical
  either way, the desktop just pairs from the selected learner's database.
  The Phase-0 spike heuristic ("most cards wins") is retired by this.
- Multiple paired devices are supported; each device is its own synced local
  copy of its learner's server database.

### FR-1 Active-recall sessions

- Queue built by the kernel scheduler (due + new cards, domain
  interleaving, new-card slotting — `src/kernel/scheduler/queue.ts`).
- Prompt shown per Bloom level (kernel `recall/prompter.ts` templates as
  offline baseline; LLM question generation as online enhancement, same
  two-step `get-review` / `evaluate-answer` shape as the Studio pipeline).
- Reveal → rate **1–4** (FSRS) → `evaluateRating()` → append to
  `review_logs`; rating 1 triggers the kernel blocker, as in CLI/Studio.
- Sessions are interruption-safe: process death, incoming call, or
  switching apps must not lose the current session position.
- Session summary at the end (cards done, again-count, next due horizon).

### FR-2 Import learning content

Ordered by leverage:

1. **Adopt an existing library**: happens through QR pairing + server-DB
   sync (FR-0/FR-4) — after pairing, the full library is on the phone.
   Direct `zam.db` file adoption is not a v1 path (see non-goals).
2. **Additive import**: bridge-token JSON per the stable `protocol.ts`
   contract — via file picker and via Android share sheet (receive
   JSON/text shared from other apps). Importing a concept creates token
   **and** card (queue-visible), mirroring `zam bridge add-token`.
3. **Quick capture**: share or paste free text/URL → token draft the user
   confirms. Optional LLM decomposition into multiple tokens is opt-in and
   off by default.
4. **Curriculum catalogs** (Epic #132 providers): the field-test content
   path is the **desktop** curriculum import (`lehrplanplus-bayern`,
   Realschule grade 9) synced to the phone — available from Phase 1 on.
   Running catalog imports *on the phone* stays a later phase, not v1.

### FR-3 Voice mode ("Sprache soll verwendbar sein")

Interpreted as **voice operation** of recall sessions (i18n is FR-6):

- TTS speaks the prompt (Android TextToSpeech, locale-aware de/en).
- STT captures the spoken answer (Android `SpeechRecognizer`, on-device).
- Evaluation: online → the existing `evaluate-answer` LLM role (per
  machine-local role configuration, ADR 2026-06-25a); offline → answer
  is transcribed, expected answer is spoken/shown, user self-rates.
- Ratings speakable in the UI locale (e.g. „nochmal / schwer / gut /
  leicht"), plus tap fallback at all times.
- Hands-free continuous mode: prompt → listen → evaluate → next, usable
  with the screen off / phone in pocket via Bluetooth headset; clean
  pause/resume on calls and audio-focus loss.
- **All speech processing stays on-device.** No audio ever leaves the
  phone; only the transcript reaches an LLM, and only when the user
  configured one.

### FR-4 Sync (server database, offline-capable)

- The server database is the configuration and sync backbone. Per
  requirement it is acceptable that the app does not work without one.
  The field test runs on **Turso Cloud (free tier)**; the pairing payload
  stays host-agnostic so a later move to self-hosted `sqld` needs only a
  re-pair.
- On the device, the database is libsql's offline-writable synced database
  (kernel provider model, ADR 2026-06-09): after the initial sync every
  feature — including full review sessions — works offline, and local WAL
  frames sync back when online. `new_remote_replica` is explicitly not this
  path because it delegates writes to the remote primary. The remote Hrana
  v3 provider remains the online-only stopgap if offline sync is delayed on
  Android.
- Credentials live in app-private machine-local storage (Keystore-backed),
  never in the shared database (same rule as `~/.zam/credentials.json`).
- `review_logs` is append-only (ULIDs) and merges trivially. Card-state
  conflicts (reviews on two devices while offline) are resolved by
  recomputing card state from the log, or documented last-write-wins —
  decided in the sync-hardening phase and recorded in the ADR.

### FR-5 Due reminder

One configurable daily notification with the due count (WorkManager).
No streaks, no gamification.

### FR-6 UI languages

- Reuse kernel i18n (`src/kernel/system/i18n.ts`, locale detection per
  ADR 2026-05-31a). German and English ship first; further packs follow
  the desktop backlog and its native-review process.
- Locale-aware LLM question/evaluation language follows the existing
  locale behavior.

## Non-functional requirements

- **Offline after pairing.** Initial configuration requires the server
  database (accepted trade-off); afterwards reviews work without network.
  No third-party account beyond the user's own Turso/sqld endpoint; LLM
  stays opt-in.
- **Privacy**: no telemetry; speech on-device (FR-3); LLM calls only to
  user-configured providers. The only network peer in the default setup
  is the paired server database.
- **Cost**: zero recurring cost by default; LLM roles follow the
  cost-first provider stance. The field test uses a keyless local recall
  provider on the phone and no cloud fallback.
- **Kernel single-source**: scheduling/rating/blocking logic must be the
  kernel TypeScript — a re-implementation (Kotlin/Rust) of FSRS is out.
- **Accessibility**: TalkBack-usable review flow, dynamic font scaling —
  the voice mode doubles as an accessibility feature.
- **Distribution (field test)**: sideload / internal track; Play-Store
  polish, signing story, and store listing are explicitly later.

## Architecture (decided 2026-07-21; Phase 0 spike validates)

**Option A — Tauri 2 Android shell (chosen).** Same stack family as
the desktop Studio (ADR 2026-05-31b): Vite/TS frontend, Rust shell. The
kernel runs **in the WebView** — it is dependency-free TypeScript against
the async `Database` contract (`src/kernel/db/types.ts`), so Android needs
one new provider backed by on-device SQLite (Tauri SQL plugin or a thin
Rust command layer). Turso offline-writable sync via the Rust `libsql`
crate's `new_synced_database` behind a Tauri command. Voice via a small
Tauri mobile plugin (Kotlin: `SpeechRecognizer` / `TextToSpeech`).

- Pro: single kernel source; stack continuity (desktop Tauri, Rust
  competence exists via `observer/`); recall-panel UI patterns reusable.
- Contra: the desktop's bundled Node-CLI bridge sidecar **does not exist
  on Android** — everything the desktop reaches through the bridge must go
  through kernel-in-WebView (or Rust commands) instead; Tauri mobile is
  younger than Tauri desktop.

**Option B — React Native/Expo + op-sqlite (libsql build).** Embedded
replica support out of the box; kernel runs in Hermes. Cost: a second
frontend stack and full UI rewrite. Kept as the Phase 0 fallback.

**Option C — Capacitor.** Fastest WebView reuse, weakest background/voice
and sync story. Not pursued.

**Option D — native Kotlin.** Rejected: duplicates kernel logic.

Repo layout (decided): `mobile/` folder in this repository, mirroring
`desktop/` (own package.json, own CI job).

## Non-goals (v1)

iOS (stack choice keeps the door open) · Wear OS · tablet/large-screen
layouts · home-screen widget · on-device embeddings/semantic search ·
OKF authoring (opening `source_link` articles read-only is fine) ·
observer/monitoring features · Play Store publication · local-only setups
and direct `zam.db` file adoption (configuration and sync assume the
server database, per FR-0).

## Status

- [x] **Phase 0 — stack spike + ADR**: Tauri 2 Android walking skeleton on
  the Pixel 9 — offline-writable sync of a test server database plus a new
  kernel DB provider listing the due queue. Validates the decided Option A
  and the sync path the whole app depends on (fallback to B only on hard
  blockers); record the ADR. Pixel 9 / Android 17 validation passed on
  2026-07-21 (queue render, offline ULID write, reconnect push/pull, 273 ms
  cold start). A Pixel 6 run may lower the hardware requirement but no longer
  blocks the phase.
- [x] **Phase 1 — QR pairing, read-only companion**: desktop "pair mobile
  device" surface (QR from machine-local credentials) + Android scanner,
  Keystore-backed credential storage, initial sync, due-queue and status
  view. FR-0 complete. Pixel 9 / Android 17 validation passed on 2026-07-21
  (final APK install/start, native camera scanner, Keystore save/load/clear,
  QR contract and local replica queue path). The built universal debug APK's
  merged manifest was additionally verified with `aapt2 dump permissions` on
  2026-07-22 and declares `android.permission.CAMERA`.
- [x] **Phase 2 — recall sessions**: full offline review loop (template
  prompts, typed answers, rate 1–4, blocker, `review_logs`, resume,
  summary). FR-1 complete. Pixel 9 / Android 17 validation passed on
  2026-07-22: a forced process stop restored the current card and typed draft;
  reveal + rating 3 committed to the local replica with Wi-Fi and mobile data
  disabled; after reconnect, manual sync delivered the FSRS update, linked
  `review_logs`/`session_steps`, and completed session to the Turso test DB.
- [x] **Phase 3 — import**: bridge-JSON via file picker + share sheet;
  quick-capture token drafts. FR-2 items 2–3. Pixel 9 / Android 17
  validation passed on 2026-07-22: a text share produced a confirmed
  quick-capture token/card; the system document picker loaded and confirmed a
  bridge-token JSON file; an `application/json` stream share restored the
  same editable draft. Manual sync delivered both confirmed cards to the
  paired Turso test database with `manual`/`llm` question provenance intact.
- [ ] **Phase 4 — voice mode**: TTS prompts, on-device STT answers, voice
  ratings, hands-free loop, audio-focus handling. FR-3 complete.
- [ ] **Phase 5 — sync hardening**: write-back robustness, conflict policy
  (log-recompute vs. last-write-wins) recorded in the ADR, token rotation
  and re-pair UX. FR-4 complete.
- [ ] **Phase 6 — field-test polish**: due notification, de/en i18n pass,
  online LLM question/evaluation wiring, performance-budget and battery
  validation on the Pixel 9 (and Pixel 6 if compatible), sideload build
  channel.

## Decisions (Thomas, 2026-07-21)

1. **Stack**: Tauri 2 Android (Option A). The Phase 0 spike stays as the
   validation gate; Expo/op-sqlite (Option B) only on hard blockers.
2. **Repo layout**: `mobile/` in this repository, mirroring `desktop/`.
3. **Server DB (field test)**: Turso Cloud free tier. Pairing payload
   stays host-agnostic; self-hosted `sqld` remains a later option.
4. **LLM roles**: paired along in the QR payload (desktop's machine-local
   role configuration, ADR 2026-06-25a — the phone stores its own copy).
   The field test selects a keyless phone-local recall provider
   (`local: true`) without a cloud fallback, so no LLM API key travels in the
   QR. It evaluates answers only; the displayed kernel template question stays
   unchanged to avoid generation latency. The exact runtime/model is selected
   and benchmarked on the 12-GB Pixel 9 in Phase 6. Offline or without the
   local runtime, sessions fall back to template prompts + self-rating.
5. **Android `applicationId`**: default `org.zamos.zam` (zam-os.org is
   owned; hyphens are invalid in application IDs — desktop's `com.zam.app`
   stays as is). Cheap to change any time before a store publication.
6. **Hardware baseline**: Pixel 9 is the validated minimum. Pixel 6 testing
   is optional; a pass lowers the minimum, while a failure leaves Pixel 9 as
   the requirement (Thomas, 2026-07-21).

## References

- ADR 2026-05-31a locale-aware active recall · ADR 2026-05-31b Tauri
  active-recall studio · ADR 2026-06-09 async database providers ·
  ADR 2026-06-25a machine-local LLM role configuration · ADR 2026-06-27
  recall-session LLM pipeline · ADR 2026-07-02 LehrplanPLUS import wizard
- Android 17 / API 37: developer.android.com/about/versions/17 ·
  apilevels.com
