# Android companion app — definition

Defines the ZAM Android companion app. Read `AGENTS.md` first and work on
exactly the next unchecked phase. Multi-phase work stays on one branch
(`feat/android-app`) and uses one focused commit per completed phase.

## Goal

Run **active-recall sessions away from the desk** — including fully by voice —
against the **same learning state** the CLI/desktop use, and **import learning
content** on the phone. Offline-first: a review session must work with no
network, no account, and no LLM configured.

The app is a *companion surface*, not a second product: all scheduling,
rating, and blocking behavior comes from the existing TypeScript kernel
(`src/kernel/`). `tests/kernel/fsrs.test.ts` remains the source of truth for
scheduling semantics.

## Platform baseline

- **minSdkVersion 37 / targetSdkVersion 37** (Android 17 "Cinnamon Bun",
  API level 37). Rationale: the requirement is "the version currently
  available for the Google Pixel 6" — Android 17 reached stable on
  2026-06-16 and rolled out to Pixel 6 and newer; the July 2026 Pixel update
  (build `CP2A.260705.006`) covers Pixel 6. No legacy compat paths, no
  support-library workarounds. Revisit only if additional, older devices
  join the field test.
- **Minimum hardware = reference device: Google Pixel 6.** Tensor GS101,
  8 GB RAM, 128 GB UFS 3.1, 6.4" 1080×2400 OLED (90 Hz), 4614 mAh,
  BT 5.2, NFC, USB-C, under-display fingerprint, no headphone jack (voice
  sessions assume speaker or Bluetooth headset). Pixel's on-device speech
  services provide offline German/English recognition — speech features
  must not assume anything better than this device.
- Pixel 6 security support is scheduled to end around 2026-10; Android 17
  is expected to be its final major OS. The API-37 floor therefore stays
  valid for the field-test device.

### Performance budgets (measured on Pixel 6)

- Cold start → first due card visible: **≤ 2 s**
- Rate card → next prompt rendered: **≤ 150 ms** (LLM work must never block
  the reveal/advance flow — same pipelining stance as ADR 2026-06-27)
- Voice round trip, prompt finished speaking → listening: **≤ 1.5 s**
- Queue build at 20 000 tokens / 5 000 due cards: **≤ 500 ms**
- A 20-minute voice session must not visibly drain the battery (validate
  qualitatively during the field test).

## Functional requirements

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

1. **Adopt an existing library**: open a copied `zam.db` via the system
   file picker (SAF). The SQLite file is the exchange format; schema
   migrations run through the kernel exactly as on desktop.
2. **Additive import**: bridge-token JSON per the stable `protocol.ts`
   contract — via file picker and via Android share sheet (receive
   JSON/text shared from other apps). Importing a concept creates token
   **and** card (queue-visible), mirroring `zam bridge add-token`.
3. **Quick capture**: share or paste free text/URL → token draft the user
   confirms. Optional LLM decomposition into multiple tokens is opt-in and
   off by default.
4. **Curriculum catalogs** (Epic #132 providers): later phase, reusing the
   curriculum manifest/import machinery — not v1.

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

### FR-4 Sync (offline-first)

- Local SQLite database is the working copy; every feature works offline.
- Opt-in Turso sync reusing the kernel provider model (ADR 2026-06-09:
  `local` / `native` / `remote`): embedded replica preferred; the remote
  Hrana v3 provider is the online-only stopgap. Credentials live in
  app-private machine-local storage, never in the shared database (same
  rule as `~/.zam/credentials.json`).
- `review_logs` is append-only (ULIDs) and merges trivially. Card-state
  conflicts (reviews on two devices while offline) are resolved by
  recomputing card state from the log, or documented last-write-wins —
  decided in the sync phase and recorded in the ADR.

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

- **Offline-first, no account.** Network, Turso, and LLM are all opt-in.
- **Privacy**: no telemetry; speech on-device (FR-3); LLM calls only to
  user-configured providers. Default configuration makes zero network
  requests.
- **Cost**: zero recurring cost by default; LLM roles follow the
  cost-first provider stance (cheap prepaid endpoints).
- **Kernel single-source**: scheduling/rating/blocking logic must be the
  kernel TypeScript — a re-implementation (Kotlin/Rust) of FSRS is out.
- **Accessibility**: TalkBack-usable review flow, dynamic font scaling —
  the voice mode doubles as an accessibility feature.
- **Distribution (field test)**: sideload / internal track; Play-Store
  polish, signing story, and store listing are explicitly later.

## Architecture direction (to be confirmed by Phase 0 spike + ADR)

**Option A — Tauri 2 Android shell (recommended).** Same stack family as
the desktop Studio (ADR 2026-05-31b): Vite/TS frontend, Rust shell. The
kernel runs **in the WebView** — it is dependency-free TypeScript against
the async `Database` contract (`src/kernel/db/types.ts`), so Android needs
one new provider backed by on-device SQLite (Tauri SQL plugin or a thin
Rust command layer). Turso embedded-replica sync via the Rust `libsql`
crate behind a Tauri command. Voice via a small Tauri mobile plugin
(Kotlin: `SpeechRecognizer` / `TextToSpeech`).

- Pro: single kernel source; stack continuity (desktop Tauri, Rust
  competence exists via `observer/`); recall-panel UI patterns reusable.
- Contra: the desktop's bundled Node-CLI bridge sidecar **does not exist
  on Android** — everything the desktop reaches through the bridge must go
  through kernel-in-WebView (or Rust commands) instead; Tauri mobile is
  younger than Tauri desktop.

**Option B — React Native/Expo + op-sqlite (libsql build).** Embedded
replica support out of the box; kernel runs in Hermes. Cost: a second
frontend stack and full UI rewrite.

**Option C — Capacitor.** Fastest WebView reuse, weakest background/voice
and sync story. Fallback only.

**Option D — native Kotlin.** Rejected: duplicates kernel logic.

Repo layout recommendation: `mobile/` folder in this repository, mirroring
`desktop/` (own package.json, own CI job). Final call in Phase 0.

## Non-goals (v1)

iOS (stack choice keeps the door open) · Wear OS · tablet/large-screen
layouts · home-screen widget · on-device embeddings/semantic search ·
OKF authoring (opening `source_link` articles read-only is fine) ·
observer/monitoring features · Play Store publication.

## Status

- [ ] **Phase 0 — stack spike + ADR**: Tauri 2 Android walking skeleton on
  the Pixel 6 — open a `zam.db` through a new kernel DB provider, list the
  due queue. Confirms Option A (or falls back to B); record the ADR.
- [ ] **Phase 1 — read-only companion**: adopt `zam.db` via file picker,
  browse due queue and card/status view.
- [ ] **Phase 2 — recall sessions**: full offline review loop (template
  prompts, typed answers, rate 1–4, blocker, `review_logs`, resume,
  summary). FR-1 complete.
- [ ] **Phase 3 — import**: bridge-JSON via file picker + share sheet;
  quick-capture token drafts. FR-2 items 2–3.
- [ ] **Phase 4 — voice mode**: TTS prompts, on-device STT answers, voice
  ratings, hands-free loop, audio-focus handling. FR-3 complete.
- [ ] **Phase 5 — sync**: Turso embedded replica (or remote fallback),
  conflict policy, credential UI. FR-4 complete.
- [ ] **Phase 6 — field-test polish**: due notification, de/en i18n pass,
  online LLM question/evaluation wiring, performance-budget and battery
  validation on the Pixel 6, sideload build channel.

## Open decisions

1. **Stack**: confirm Option A after the Phase 0 spike (fallback B).
2. **Repo layout**: `mobile/` in-repo (recommended) vs. separate repo.
3. **Sync scope for the field test**: is `zam.db` adoption (FR-2.1) enough
   to start, with Turso deferred to Phase 5 — or is live sync required
   before daily use?
4. **LLM roles on the phone**: the phone is its own "machine" under the
   machine-local role model (ADR 2026-06-25a) — which provider(s) should
   it use, and is offline/self-rated mode acceptable as the default?
5. **Android `applicationId`** (desktop uses `com.zam.app`).

## References

- ADR 2026-05-31a locale-aware active recall · ADR 2026-05-31b Tauri
  active-recall studio · ADR 2026-06-09 async database providers ·
  ADR 2026-06-25a machine-local LLM role configuration · ADR 2026-06-27
  recall-session LLM pipeline · ADR 2026-07-02 LehrplanPLUS import wizard
- Android 17 / API 37: developer.android.com/about/versions/17 ·
  apilevels.com
