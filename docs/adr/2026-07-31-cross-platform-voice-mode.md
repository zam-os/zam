# Cross-Platform Voice Mode: Device-First Speech with a Costed Cloud Tier

**Status:** Accepted — shared loop and macOS engine validated locally; Windows
and iOS engines await device verification (see Validation).

**Supersedes nothing.** Extends the Android voice review defined in
[2026-07-21](2026-07-21-android-companion-tauri-shell.md) to the desktop app and
the iOS companion, and fills in the `stt`/`tts` capabilities reserved by
[2026-07-12](2026-07-12-unified-capability-model-registry.md).

## Context

Voice review shipped on Android in 0.22.x: ZAM reads a card aloud, listens for
the spoken answer, and maps a spoken word to an FSRS rating. It has turned out
to be the feature that makes review happen *at all* on days that would otherwise
have none — on a walk, during housework, while exercising. Reviewing with the
body moving is not a degraded mode of studying; for a lot of material it is a
better one, and it is the only mode available when the hands and eyes are busy.

The desktop app (macOS, Windows) and the iOS companion have no voice mode. The
desktop is where most ZAM review actually happens, and a laptop on a kitchen
counter is a perfectly good hands-free study device.

Two forces pull against each other:

- **Locality.** ZAM's whole posture is that a learner's material and behaviour
  stay on their machine. Speech is worse than text here, not better: raw audio
  carries the speaker's voice, their hesitations, and whatever else is audible in
  the room. Shipping that to a third party by default would be a real change in
  what ZAM is.
- **It has to work.** On-device speech quality is bounded by the device.
  Recognition of a 15-year-old's rushed German answer over wind noise is exactly
  the case where a small on-device model degrades most, and a local recognizer
  may be missing, unavailable, or catastrophically slow on older hardware. A
  voice mode that mis-hears every third answer does not get used, and the
  fallback is not "review by typing" — it is "do not review".

The second point deserves to be stated plainly, because it drives the decision:
**the cost of not learning dominates the cost of the API call.** Cloud speech for
a review session is fractions of a cent. The value of the material actually
being retained is, on any honest accounting, orders of magnitude larger. Refusing
to spend the cent is a false economy — but it is the learner's call to make, not
ZAM's, because the thing being spent is not only money.

## Decisions

### 1. Two tiers, resolved per capability, never silently

Voice mode has a **device tier** (the platform's own speech stack — no third
party, no per-use cost) and a **cloud tier** (an entry in the capability model
registry with `stt`/`tts` set). Speech-to-text and text-to-speech are resolved
**independently**: Linux has local synthesis but no local recognizer, and a
learner with no cloud model configured should still get local reading-aloud.

Resolution lives in `src/kernel/recall/voice-review.ts` and returns a *reason*
alongside each tier, so a surface can always say why. Falling back to the cloud
without telling the learner would make the preference dishonest, which is the
one failure mode that would undermine the whole design.

### 2. The learner chooses the preference; the default is device-first

Three options in Settings, phrased around what the learner cares about rather
than around technology:

| Preference | Meaning | Trade accepted |
|---|---|---|
| `device-only` | Nothing leaves the device, ever. | Voice mode may be unavailable on this device or in this language. |
| `device-first` *(default)* | Device when it can, cloud when it cannot. | A session may involve a third party; ZAM says so when it does. |
| `quality-first` | Cloud first, device as fallback. | Per-use cost and a third party, in exchange for better recognition and more natural voices. |

`device-first` is the default because it is the honest reading of ZAM's posture:
prefer the private, free path, but do not let purity turn into a learner who
skipped their reviews. `device-only` remains a real, supported choice for
learners (or parents, or schools) who want the guarantee, and it is allowed to
be unavailable — that is the point of it.

### 3. The device tier is each platform's native speech stack

Not a bundled model. Whisper-class local models were considered and rejected for
0.24.0 (see Alternatives).

| Platform | Local STT | Local TTS |
|---|---|---|
| macOS | `SFSpeechRecognizer`, `requiresOnDeviceRecognition` | `AVSpeechSynthesizer` |
| iOS / iPadOS | same | same |
| Windows | WinRT `SpeechRecognizer` (installed language pack) — see caveat | WinRT `SpeechSynthesizer` |
| Linux | *none* — falls back per §1 | `speech-dispatcher` |
| Android | `SpeechRecognizer` on-device (shipped 0.22.x) | `TextToSpeech`, embedded voices only |

These are free, need no download management, are already tuned to the user's
locale, and — critically — are covered by the OS privacy model the user already
consented to, rather than by a new one ZAM invents.

**Windows caveat, recorded honestly rather than assumed away.** macOS exposes an
explicit on-device switch (`requiresOnDeviceRecognition`), so "this stays on the
machine" is a guarantee we can make and enforce. Windows has no equivalent flag:
`Windows.Media.SpeechRecognition` serves free-form dictation from the installed
speech language pack, but Microsoft has historically documented the predefined
dictation grammar as requiring a connection, and the behaviour varies with the
machine's online-speech setting. ZAM therefore treats Windows local STT as
*available only if the recognizer compiles its constraints on that machine*, and
does not claim it is provably offline. If verification (see Validation) shows it
reaches Microsoft, the honest fix is to report Windows local STT as unavailable
under `device-only` and let the tiering route those users to a tier they
explicitly chose — not to keep a guarantee we cannot keep.

### 4. Capture once, transcribe twice

The microphone capture path is written **once per platform** and produces an
audio file. That file is then either transcribed on-device or uploaded to the
cloud STT endpoint. One capture implementation, two transcription tiers, and
switching preference does not touch the audio path.

This also settled the macOS recognizer design: `SFSpeechURLRecognitionRequest`
over a recorded file, rather than a streaming `AVAudioEngine` tap. The streaming
API is the more natural fit for dictation, but file-based recognition is
dramatically simpler to get right from Rust, is what the cloud tier needs
anyway, and endpointing (stop when the learner stops talking) is handled once, in
the recorder, via `AVAudioRecorder` metering.

### 5. The desktop engine is pure Rust; iOS is Swift

macOS speech is bound from Rust via `objc2-speech` / `objc2-avf-audio` rather
than by compiling a Swift package into the desktop app.

This duplicates roughly 200 lines of Apple speech logic between the desktop's
`voice.rs` and the iOS `VoicePlugin.swift`, which is a genuine cost. It is
accepted to keep the desktop build pure Rust: the macOS desktop release is
notarized through a pipeline that took real effort to stabilize
([2026-07-27](2026-07-27-macos-notarization.md)), and adding a Swift toolchain
step to `build.rs` puts that pipeline at risk for a saving of 200 lines. iOS has
no such choice — Tauri iOS plugins are Swift by construction.

### 6. Cloud speech goes through the existing capability registry

No new provider concept. `stt` and `tts` were reserved as "future audio" in
[2026-07-12](2026-07-12-unified-capability-model-registry.md); voice mode is what
makes them real. Endpoints are OpenAI-shaped (`/v1/audio/transcriptions`,
`/v1/audio/speech`), selected by walking the registry in `order` exactly as
`text` and `embedding` already are, with credentials resolved from
`~/.zam/credentials.json` and never inlined.

Consequence: the cloud tier is provider-agnostic and cost-transparent. A learner
who wants the cheapest usable path can point `stt` at a hosted Whisper-turbo
endpoint for cents per hour; the same slot accepts a self-hosted
`whisper.cpp`/Speaches server, which then counts as **local** (`local: true`)
and satisfies `device-only`. That last property is why the self-hosted option is
worth keeping even though it needs setup: it is the escape hatch for a Linux
user who wants strict locality.

### 7. Preference is machine-local

`voice.enginePreference` lives in `~/.zam/config.json`, not in the database. The
right answer depends on the hardware in front of the learner — a Turso-shared DB
must not push a phone's preference onto a desktop.

## Alternatives considered

**Bundled Whisper (`whisper-rs`).** One implementation for every desktop OS,
consistent quality, fully local, and it would have given Linux a local
recognizer. Rejected for 0.24.0: it puts a C++ build into the Tauri pipeline for
all three desktop targets, adds a 75–150 MB model download and its management
(which model? where? when?), and its CPU cost on the older hardware ZAM targets
is exactly where it would hurt. Worth revisiting once the two-tier plumbing is
proven — the `VoicePort` seam makes it a drop-in third engine.

**Web Speech API in the WebView.** Nearly free where it works. Rejected because
it does not work where it matters: Chromium's `SpeechRecognition` in WebView2 has
no usable backend, so Windows — half the target — would have had no local STT at
all. `speechSynthesis` alone would have solved only the easy half.

**Cloud-only.** Simplest, best quality, and would have shipped in a fraction of
the time. Rejected: it makes every spoken answer a third-party event by
construction, with no opt-out. That is not a trade ZAM gets to make on the
learner's behalf, particularly with minors in the field test.

## Consequences

- Voice mode is the first ZAM feature whose **availability legitimately differs
  per device**. Surfaces must render "voice mode is not available here, and this
  is why", not a dead button.
- ZAM now handles microphone audio on four platforms. Audio is held only for the
  duration of one answer, is never written to the database, and the temporary
  capture file is deleted after transcription.
- `device-only` users on Linux have no voice mode unless they run a local STT
  endpoint. Accepted and documented rather than papered over.
- Two Apple speech implementations (Rust and Swift) must be kept behaviourally in
  step. Their shared contract is the `VoicePort` command surface, and the shared
  loop above it means drift shows up as a platform-specific bug, not a divergent
  UX.

## Validation

- [x] Shared loop extracted to the kernel with the Android behaviour unchanged;
      `tests/mobile/voice.test.ts` and `voice-wiring.test.ts` pass untouched
      against the moved implementation.
- [x] Tier-resolution logic covered by `tests/kernel/voice-review.test.ts`,
      including the per-capability fallback and the `device-only` guarantee that
      no capability silently leaves the device.
- [x] `objc2-speech` / `objc2-avf-audio` confirmed to expose everything the
      macOS engine needs: on-device recognition (`setRequiresOnDeviceRecognition`),
      file-based requests (`SFSpeechURLRecognitionRequest`), synthesis, and
      metered recording.
- [x] macOS device tier compiles against the real frameworks and probes safely
      without consent. On the development Mac (macOS 26.5) the probe reports
      on-device recognition **supported** and system voices **present**, with
      authorization `prompt` — i.e. the tier is genuinely available and only
      consent is outstanding.
- [ ] macOS end-to-end voice loop inside the signed app bundle. Consent is
      granted to a bundle carrying `NSMicrophoneUsageDescription` and
      `NSSpeechRecognitionUsageDescription`, and the hardened runtime
      additionally needs `com.apple.security.device.audio-input`; a bare
      `cargo test` binary is terminated by the OS instead of prompting, so this
      step cannot be short-circuited.
- [ ] Windows end-to-end voice loop, including behaviour when the locale's
      speech language pack is not installed, **and** whether recognition works
      with the machine's online speech recognition turned off. The answer
      decides whether Windows local STT may be offered under `device-only`
      (see the Windows caveat above).
- [x] iOS engine implemented and compiled. `cargo check --target
      aarch64-apple-ios` builds the Swift package, which caught that it targets
      a lower deployment version than its manifest declares — the iOS 17
      `AVAudioApplication` API needed an availability guard with the pre-17 path
      kept. `tauri ios init` was confirmed to leave the versioned `project.yml`
      alone, so the usage descriptions reach the generated Info.plist.
- [ ] iOS end-to-end voice loop via TestFlight on the field-test iPad.
      Blocked until now by a second thing: the bundle version had drifted to
      0.21.0 and App Store Connect rejects an upload that does not increase it.
      The release workflow now stamps it from `package.json`.
- [x] Cloud tier implemented over the registry and covered by
      `tests/cli/speech.test.ts`: endpoint selection refuses Anthropic-flavour
      and agent-transport entries, the recording is deleted as soon as it has
      been read, and an empty transcription is an error rather than a blank
      answer. Speech models are detected by the capability probe without being
      offered for `text`, so an audio endpoint cannot be selected for recall
      coaching.
- [ ] Cloud tier verified against at least one hosted `stt` and one hosted `tts`
      endpoint, with the cost per review session recorded in the release notes.
      Only stubbed endpoints have been exercised so far.

## Evidence

- Kernel: `src/kernel/recall/voice-review.ts`
- Desktop engine: `desktop/src-tauri/src/voice.rs`
- iOS engine: `mobile/src-tauri/ios/Sources/VoicePlugin.swift`
- Android engine (prior art):
  `mobile/src-tauri/gen/android/app/src/main/java/org/zamos/zam/VoicePlugin.kt`
- Cloud tier: `src/cli/llm/speech.ts`
- Tests: `tests/kernel/voice-review.test.ts`, `tests/mobile/voice.test.ts`
