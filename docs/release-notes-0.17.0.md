# ZAM 0.17.0 — Android companion, first alpha

ZAM now runs active-recall sessions away from the desk. The new Android
companion app reviews the same learning state the CLI and desktop Studio
use — scheduling, rating and blocking all come from the one shared kernel,
running unchanged inside the app. After pairing, a full review session works
with no network and no cloud account.

This is an **alpha for the two-device field test**: validated on the
Pixel 9 (Android 17, API 37), sideloaded from this release, with in-app
updates from here on.

## Highlights

- **Pair by scanning a QR code.** The desktop Studio renders a pairing code
  from its machine-local credentials; the phone scans it, binds itself to
  one learner, stores the credentials encrypted in the Android Keystore and
  runs the initial sync. Manual entry stays available as a fallback.

- **Offline-first reviews.** The phone keeps an offline-writable synced copy
  of the learner's server database (libsql). Queue building, template
  prompts, reveal, FSRS ratings, prerequisite blocking and review logs all
  work offline; local changes sync back when connectivity returns.

- **Interruption-safe sessions.** An incoming call, app switch or process
  death restores the same card with the same draft answer; already-rated
  cards are never asked twice.

- **Import on the phone.** Bridge-token JSON via the document picker or the
  Android share sheet, plus quick capture of shared text or URLs — always
  through an editable draft, and every confirmed concept creates token and
  card, exactly like `zam bridge add-token`.

- **Voice mode.** The prompt is spoken with on-device TTS, the answer is
  transcribed with on-device speech recognition, and ratings are spoken
  words („Nochmal / Schwer / Gut / Leicht", "Again / Hard / Good / Easy").
  A hands-free loop with a foreground service and wake lock supports
  screen-off reviewing; no audio ever leaves the phone.

- **On-device answer evaluation.** Revealed answers are judged by Gemini
  Nano through the ML Kit GenAI Prompt API (AICore → Tensor NPU on the
  Pixel 9), with the same structured evaluation prompt as the desktop
  Studio. A paired cloud endpoint is only a fallback; without either, the
  learner simply self-rates.

- **Daily due reminder.** One configurable WorkManager notification with the
  last-known due count — suppressed at zero, no streaks, no gamification.

- **German-first, English included.** The companion UI ships as a complete
  de/en reference pair and follows the paired learner's locale.

- **Sideload update channel.** Each release publishes
  `ZAM_Mobile_<version>_aarch64.apk` plus a `mobile-latest.json` manifest;
  the app checks it on launch and in Settings and hands the downloaded APK
  to the system installer.

## Alpha notes

- **Devices:** Pixel 9 / Android 17 (API 37) is the validated reference and
  current minimum. A Pixel 6 compatibility run is optional and may lower
  the minimum later.
- **Pairing security tradeoff:** the QR payload carries the live database
  token (and, if a keyed cloud recall provider is selected, that API key)
  in clear text. Render it only in private; a captured payload stays valid
  until the token is rotated. Accepted for the owner-present field test;
  short-lived/scoped tokens are the recorded follow-up.
- **Sync conflicts** resolve last-write-wins at the database level. Each
  field-test learner reviews on a single device, so same-card conflicts do
  not arise; deterministic log-recompute is the recorded upgrade for
  multi-device learners.
- **First install is a one-time sideload** (enable installs from unknown
  sources for ZAM). Later versions update in place when signed with the
  same key.
- Desktop and CLI behavior is unchanged; the kernel gained an optional
  session-step path for review actions used by the mobile session flow.
