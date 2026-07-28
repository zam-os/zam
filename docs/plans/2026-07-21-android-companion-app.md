# Android companion app — definition

Defines the ZAM Android companion app. Read `AGENTS.md` first and work on
exactly the next unchecked phase. Multi-phase work stays on one branch
(`feat/android-app`) and uses one focused commit per completed phase.

## Goal

Run **active-recall sessions away from the desk** — including fully by voice —
against the **same learning state** the CLI/desktop use, and **import learning
content** on the phone. **Online-only against a server database** (ADR
2026-07-23): the phone does not keep an offline-writable replica; without
network, durable writes are unavailable and the app says so honestly. Local
LLM/NPU evaluation remains optional and on-device.

The app is a *companion surface*, not a second product: all scheduling,
rating, and blocking behavior comes from the existing TypeScript kernel
(`src/kernel/`). `tests/kernel/fsrs.test.ts` remains the source of truth for
scheduling semantics.

Setup: desktop **local SQLite is for fast single-machine setup only** and
**does not offer QR pairing**. Mobile is unlocked after a **server DB
(Turso/sqld) is attached** via a dedicated wizard (separate issue), then the
phone is **configured by scanning a QR** from that server-DB desktop (FR-0).
Cloud model config lives in the server DB; machine-local models stay on the
desktop (ADR 2026-07-23).

### Field-test users (2026)

Two paired devices, two different learners:

- **Primary learner: a ninth-grade Realschule student (Bavaria)** — preparing
  the 2026/27 school year with the goal of a real grade improvement. Previous
  success with an active-recall tool shows the method fits; the app's job is to
  make it effortless and daily.
  - **Primary device is a school-issued iPad (A16, 11th generation)**: the
    school runs a Tablet-Klasse, already used for the whole of grade 8. This is
    the device carried to every lesson, which makes iPadOS the platform that
    decides whether ZAM is part of the school day or only the evening. See
    [ADR 2026-07-26](../adr/2026-07-26-ipados-companion-target.md).
  - Android remains available on the Pixel 6 if its optional compatibility run
    passes, otherwise a Pixel 9.
- The project owner on a **Pixel 9** (Android 17), the validated Android
  reference device and current Android minimum requirement. A **Pixel 10** run
  also passed (2026-07-26), so the Android range is validated at both ends.

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
- **Pixel 10 validated 2026-07-26.** Ran well with no changes, so the Android
  reference range is confirmed upward as well as downward.

### iOS / iPadOS baseline

Added 2026-07-26; see [ADR 2026-07-26](../adr/2026-07-26-ipados-companion-target.md).

- **Deployment target iOS/iPadOS 17.0.** The iPad reference device ships 18.3
  and cannot run lower; 17.0 is headroom for the iPhone compatibility target
  and against MDM-deferred OS updates on a school-managed device.
- **Reference device: iPad (A16, 11th generation)** — the Tablet-Klasse device.
- **Minimum device: iPad (A13, 9th generation)** — see ADR 2026-07-26. (Formerly iPhone 14: A15, 390pt wide — narrower than any validated
  Android device). Not yet secured as a test device.
- **No on-device evaluation on either.** Both are below the A17 Pro / M-series
  floor for Apple Intelligence, so the Foundation Models framework is
  unavailable and Gemini Nano has no counterpart. Cloud endpoint or self-rating.
- **Distribution is TestFlight only** — iOS has no sideload channel. Blocked
  outright if the school's MDM supervises the device and forbids installs;
  verify on the physical iPad before investing further.

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

- **Prerequisite:** a server database is attached on the desktop (Turso Cloud
  free tier for the field test, or compatible `sqld`). Attachment is done
  through a **DB create/connect wizard** (tracked in a separate issue) — not
  from a local-only install. While the desktop uses only a local `zam.db`,
  the "pair mobile" surface is **hidden/disabled** with a clear CTA to run
  the wizard first (ADR 2026-07-23).
- When a server DB is present, Studio shows "pair mobile device" and renders
  a QR from server credentials: a versioned `zam-pair` JSON payload with
  libsql/Turso URL, auth token, learner user id, and optional bootstrap
  settings (locale). **Cloud LLM/vision config is not packed into the QR** —
  it is read from the server DB once the phone is online. On-device recall
  evaluation (e.g. Nano) does not need keys in the QR.
- First run on Android: scan the code (camera permission), validate the
  payload version, store credentials in Keystore-backed storage, open the
  **online** server DB, land in the due queue. Manual URL/token entry remains
  a fallback.
- Security: the QR encodes a live DB token. Render only on explicit action
  with a shoulder-surfing note. Prefer database-scoped tokens long-term.
  Re-pairing replaces stored credentials; revoked/expired tokens force
  re-pair, never silent data loss.
- Pairing binds the device to **one learner**. Preferred family setup: **one
  server database per learner**.
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
   off by default. Photographing/importing an image (textbook, worksheet,
   screenshot) is an **online-only** extension of this path through the cloud
   `vision` role — decompose into confirmable token drafts; see Phase 7.
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

### FR-4 Server database (online-only; ADR 2026-07-23)

- The server database is the **shared learning state and cloud-config
  backbone**. The companion **requires** network access to it for durable
  reads/writes. Offline-capable local replicas are **out of scope**.
- Field test: **Turso Cloud (free tier)**; pairing payload stays host-agnostic
  so self-hosted `sqld` is a re-pair later.
- On the device, open the remote primary (Hrana/libsql remote — no
  offline-writable `new_synced_database` product path). Every rating,
  import, and settings read goes to the server while online; without
  network, show an honest unavailable state.
- Credentials live in app-private Keystore-backed storage on the phone.
- Multi-device: last successful online write wins for card rows;
  `review_logs` remain append-only (ULIDs). No offline conflict design.

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

- **Online against the server DB after pairing** (ADR 2026-07-23). Local
  desktop SQLite remains the fastest single-machine setup; multi-device and
  mobile require the Turso/sqld wizard first. No third-party account beyond
  the user's own Turso/sqld endpoint; LLM stays opt-in.
- **Privacy**: no telemetry; speech on-device (FR-3); LLM calls only to
  user-configured providers. Network peers: the paired server database and
  any user-configured cloud model endpoints.
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

> **Superseded 2026-07-26:** "iOS (stack choice keeps the door open)" and
> "tablet/large-screen layouts" are no longer non-goals. The primary learner's
> school runs a Tablet-Klasse on a school-issued iPad, so iPadOS became a
> required target — see
> [ADR 2026-07-26](../adr/2026-07-26-ipados-companion-target.md).

Wear OS · home-screen widget · on-device embeddings/semantic search ·
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
- [x] **Phase 4 — voice mode**: TTS prompts, on-device STT answers, voice
  ratings, hands-free loop, audio-focus handling. FR-3 complete. Implementation
  and the API-37 APK build are present: only installed offline TTS voices and
  `createOnDeviceSpeechRecognizer` are accepted; German/English voice ratings
  feed the existing kernel review session; a microphone/media-playback
  foreground service plus wake lock and audio focus support screen-off use.
  Pixel 9 / Android 17 re-validation on the real learner database
  (`thomas`, 2026-07-23): mic permission granted, German TTS speak ~3 s
  (`voice_speak` de-DE), hands-free controller + on-device STT code path
  shipped; voice data installer remains as recovery if a device lacks
  offline voices.
- [ ] **Phase 5 — sync hardening**: write-back robustness, conflict policy
  (log-recompute vs. last-write-wins) recorded in the ADR, token rotation
  and re-pair UX. FR-4 complete. Implementation present: the conflict policy
  is decided (last-write-wins for the field test; log-recompute recorded as
  the future upgrade — Thomas, 2026-07-22) and documented in the ADR;
  `mobile/src/sync.ts` retries only transient sync failures with capped
  backoff and classifies an expired/rotated token as an auth failure, which
  routes the learner to re-pairing (`promptRepair`) instead of retrying dead
  credentials; covered by `tests/mobile/sync.test.ts`. Pixel 9 completion
  remains open: exercise an expired-token sync end-to-end and confirm the
  re-pair prompt on the device.
- [ ] **Phase 6 — field-test polish**: due notification, de/en i18n pass,
  online LLM question/evaluation wiring, performance-budget and battery
  validation on the Pixel 9 (and Pixel 6 if compatible), sideload build
  channel. Due notification (FR-5) implemented and build-validated: a
  configurable daily WorkManager job (`ReminderPlugin`/`DueReminderWorker`,
  `mobile/src/reminder.ts`) posts one notification with the last stored due
  count, suppressed at zero, POST_NOTIFICATIONS-gated, no gamification; the
  `aarch64` debug APK assembles with the merged permission. Pixel 9 completion
  remains open: grant notifications, set the time a minute ahead, and confirm
  one reminder fires with the correct count. The companion UI was aligned to
  the desktop ZAM visual language (gradient wash, frosted cards, purple→cyan
  primary, FSRS rating colours, light/dark) and settings (reminder + re-pair)
  moved behind a gear icon in a dedicated settings view. The de/en i18n pass
  is done: `mobile/src/i18n.ts` holds a complete de/en reference pair (parity
  asserted in `tests/mobile/i18n.test.ts`), static chrome is localised through
  `data-i18n` attributes and dynamic strings through `t()`/`tf()`; the locale
  comes from the paired `settings.locale`, else `navigator.language`. Native
  plugin (voice/reminder Kotlin) strings remain German-only for now. Intelligent
  answer evaluation is implemented (issue #210): Gemini Nano via ML Kit GenAI
  Prompt API on the Tensor NPU is always tried first (even when a cloud recall
  endpoint was paired — WebView CORS makes direct cloud `fetch` unreliable);
  cloud HTTP remains a secondary fallback; self-rate otherwise. Pixel 9
  validation on the real `thomas` library (2026-07-23): after QR re-pair,
  reveal → evaluation panel in ~15 s with meta `via Gemini Nano (on-device)`.
  Sideload update channel is implemented: `release.yml` builds an aarch64
  release APK, uploads `ZAM_Mobile_<ver>_aarch64.apk` + `mobile-latest.json`
  to the GitHub draft release, and the companion checks that manifest on
  launch / Settings → App-Update (native download + system package installer).
  Remaining Phase-6 items (performance/battery validation on the Pixel 9) are
  open; camera/screenshot import (#211) is split out as **Phase 7** below.
- [x] **Phase 7 — camera/screenshot import (cloud VL)**: photograph or pick a
  textbook/worksheet/screenshot on the phone → a cloud vision-language model OCRs
  and decomposes it into **multiple** bridge-token drafts → the learner confirms
  each through the existing draft UX → token+card, synced. Completes FR-2 item 3
  for the image modality (#211). **Online-only by design: import is unavailable
  offline** — no queue, no on-device VL (on-device VL stays a non-goal); a
  missing cloud vision config, no connectivity, or a failed call is rejected
  honestly, never silently attempted (Thomas, 2026-07-23). Decided approach
  (Thomas, 2026-07-23 + revise): in-app camera+gallery capture (pure-web
  `<input capture>` with WebView canvas-downscale — no manifest/Kotlin change;
  share-sheet `image/*` deferred); **vision settings come from the synced
  learner DB** (`llm.vision.*` / `llm.*` via kernel `getSetting`) — pairing QR
  stays DB-only for this path (no vision block in the QR); field-test provider
  is **OpenAI-compatible chat-completions** only; the cloud call runs through a
  **native Rust command** (`reqwest`, bypasses WebView-CORS); one image yields
  **several** drafts confirmed via a "draft i of N" stepper; token `provider`
  is stamped `vision:<model>`. Implemented:
  1. Config (mobile) — `mobile/src/vision-config.ts` reads
     `llm.vision.enabled|url|model|api_key` (fallback `llm.url|model|api_key`)
     from the local synced DB; usable only when enabled, non-loopback, and
     cloud-reachable. Missing/disabled/local → honest reject. No pairing-contract
     change.
  2. Native transport — `mobile/src-tauri/src/vision.rs` (`reqwest`) exposes a
     thin `vision_request({ url, headers, body, timeoutMs? })` returning the
     raw response body text; Android implements, other targets stub-error;
     registered in `lib.rs`. INTERNET permission is already declared.
  3. Capture + decomposition (WebView) — `mobile/src/image-import.ts` acquires
     and downscales the image (≤1568 px long edge, JPEG ≈0.7, post-downscale
     byte ceiling); `mobile/src/vl-import.ts` builds the `chat-completions`
     multimodal request (OCR-and-decompose → strict JSON array), parses it
     fence-tolerantly, and normalizes each entry through
     `normalizeBridgeDraft` with origin `image-vl`.
  4. Confirm UX + origin — multi-draft controller drives a "draft i of N"
     stepper (Save & next / Skip); `image-vl` origin → `question_source: "llm"`
     and `provider: "vision:<model>"`; de/en i18n parity asserted.
  Unit tests cover config gating, parse/normalize, downscale bounds, confirm
  provenance, and multi-draft advance/skip. **Pixel 9 validation still open:**
  with `llm.vision.*` set on the paired Turso DB, photograph a Realschule
  grade-9 worksheet → several drafts → confirm two, skip one → sync delivers
  cards with `llm` question provenance and `vision:<model>` provider.

## Decisions (Thomas, 2026-07-21)

1. **Stack**: Tauri 2 Android (Option A). The Phase 0 spike stays as the
   validation gate; Expo/op-sqlite (Option B) only on hard blockers.
2. **Repo layout**: `mobile/` in this repository, mirroring `desktop/`.
3. **Server DB (field test)**: Turso Cloud free tier. Pairing payload
   stays host-agnostic; self-hosted `sqld` remains a later option.
4. **LLM roles**: originally paired in the QR; **revised 2026-07-23** —
   cloud model config lives in the server DB; local models stay
   machine-local; phone on-device evaluation (Nano) needs no cloud key in
   the QR. Template prompts + self-rating remain the no-model fallback.
5. **Android `applicationId`**: default `org.zamos.zam` (zam-os.org is
   owned; hyphens are invalid in application IDs — desktop's `com.zam.app`
   stays as is). Cheap to change any time before a store publication.
6. **Hardware baseline**: Pixel 9 is the validated minimum. Pixel 6 testing
   is optional; a pass lowers the minimum, while a failure leaves Pixel 9 as
   the requirement (Thomas, 2026-07-21).

## Decisions (Thomas, 2026-07-23) — ADR 2026-07-23

7. **Online-only companion DB**: abandon offline-writable synced replica as
   a product goal; phone uses the remote primary while online
   (`libsql::Builder::new_remote` in `mobile/src-tauri/src/db.rs`).
8. **No QR on local-only desktop**: pair surface requires server DB;
   local `zam.db` is single-machine fast path only.
9. **Turso create/connect wizard** ([#218](https://github.com/zam-os/zam/issues/218)):
   Studio **Server database** form + `zam bridge server-db-connect` store and
   verify credentials; pair button stays disabled until a non-local target is
   active. Full create-DB / local→Turso migration UX remains on #218.
10. **Cloud model config in server DB**; **local models + their order slot
    machine-local** only.

## References

- ADR 2026-05-31a locale-aware active recall · ADR 2026-05-31b Tauri
  active-recall studio · ADR 2026-06-09 async database providers ·
  ADR 2026-06-25a machine-local LLM role configuration · ADR 2026-07-12
  unified capability model registry · ADR 2026-07-21 Android companion
  shell · **ADR 2026-07-23 online-only server DB and mobile gating** ·
  ADR 2026-06-27 recall-session LLM pipeline · ADR 2026-07-02 LehrplanPLUS
  import wizard
- Android 17 / API 37: developer.android.com/about/versions/17 ·
  apilevels.com
