---
type: architecture
title: Hands-Free Voice Mode
description: Voice review runs one shared kernel loop over a device tier of native OS speech and a cloud tier from the capability registry, resolved per capability from a machine-local user preference.
tags:
  - voice
  - recall
  - desktop
  - mobile
resource: "https://github.com/zam-os/zam/blob/main/docs/okf/voice-mode.md"
timestamp: 2026-07-31T08:00:00Z
---

Voice mode reads a due card aloud, listens for the spoken answer, and maps a
spoken word to an FSRS rating — so a review session works on a walk, during
housework, or at the gym. It shipped on Android in 0.22.x and reached the
macOS/Windows desktop in 0.24.0.

# One loop, many engines

`HandsFreeReviewController` in `src/kernel/recall/voice-review.ts` drives every
surface. It is platform-free: it never touches a microphone, a speaker, or the
network, and reaches the outside world only through an injected `VoicePort`.

The loop per card:

1. Speak the question.
2. Listen; a blank transcript aborts the session.
3. Capture the answer and reveal the card. `revealAnswer()` may return a
   promise and the loop awaits it — the desktop reveal runs an LLM evaluation
   and repaints, and speaking earlier would read the previous card aloud.
4. Speak the evaluation if the adapter offers one, else read the expected
   answer back.
5. Listen for a rating word and re-prompt until one parses.

`parseSpokenRating` matches whole words only, in German and English
(`nochmal`/`again` → 1 … `leicht`/`easy` → 4). `resolveVoiceLocale` narrows any
tag to `de-DE` or `en-US`; anything not English becomes German.

Each surface supplies its own adapter and port:

| Surface | Port implementation |
| --- | --- |
| Desktop | `desktop/src/voice.ts` → Tauri commands in `desktop/src-tauri/src/voice.rs` |
| Android | `mobile/src/main.ts` → `VoicePlugin.kt` |

# Two tiers, resolved per capability

The **device tier** is the platform's own speech stack: no third party, no
per-use cost, quality bounded by the machine. The **cloud tier** is an entry in
the capability model registry with the `stt` or `tts` flag set.

| Platform | Local speech-to-text | Local text-to-speech |
| --- | --- | --- |
| macOS | `SFSpeechRecognizer`, on-device required | `AVSpeechSynthesizer` |
| Windows | WinRT `SpeechRecognizer` | WinRT `SpeechSynthesizer` |
| Linux | none | `speech-dispatcher` |
| Android | `SpeechRecognizer`, on-device | `TextToSpeech`, embedded voices |

Speech-to-text and text-to-speech resolve **independently**. Linux has local
synthesis but no local recognizer, so it reads cards aloud locally while
transcribing through the cloud; a learner with no cloud model configured still
gets local reading-aloud.

`resolveVoiceEnginePlan(preference, availability)` returns a tier plus a
*reason* per capability, so a surface can always state why. `isVoiceModeUsable`
requires both halves — a session needs to both speak and listen.

# The user's preference

Stored machine-locally as `voice.enginePreference` in `~/.zam/config.json`, read
and written through `zam bridge voice-preference-get` / `voice-preference-set`.
It is deliberately **not** a database setting: the right answer depends on the
hardware in front of the learner, and a Turso-shared database would push a
phone's answer onto their desktop.

| Preference | Behaviour |
| --- | --- |
| `device-only` | Device or nothing. Voice mode may be unavailable, by design. |
| `device-first` *(default)* | Device when it can, cloud when it cannot. |
| `quality-first` | Cloud first, device as fallback. |

Falling back never happens silently: the plan's reason drives Settings copy
stating whether speech currently leaves the device.

# Capture once, transcribe twice

The microphone path is written once per platform and produces an audio file;
the preference only decides who turns it into text.

- `voice_listen` records and recognizes on-device.
- `voice_capture` records and returns the file path for the cloud tier.
- `zam bridge voice-transcribe --audio-file <path>` uploads it and **deletes
  the recording as soon as it has been read**, success or failure.
- `voice_discard_capture` cleans up when the bridge call never happens; it
  refuses any path outside ZAM's own recordings in the temp directory.

Audio crosses the bridge as a path rather than base64 because a few seconds of
speech overflows the process argument limit. Synthesis goes the other way:
short text in as an argument, audio back as base64 on stdout, played from a
blob in the WebView.

Windows is the exception to the shared capture path — `RecognizeAsync` owns the
microphone and returns text directly, so `voice_capture` reports unsupported
there.

# Cloud endpoints

`src/cli/llm/speech.ts` calls OpenAI-shaped `/audio/transcriptions` and
`/audio/speech` on endpoints selected from the registry by `order`, exactly as
`text` and `embedding` are. It is provider-agnostic: a hosted Whisper endpoint
and a self-hosted `whisper.cpp`/Speaches server are the same code path, and the
registry's `local` flag is what lets the self-hosted one satisfy `device-only`.

Refused rather than called and failed:

- `anthropic-messages` entries — the Messages API has no audio routes.
- `agent`-transport entries — a harness cannot carry audio.

The capability probe recognizes speech models by name and does **not** classify
them as `text`, so an audio endpoint can never be selected for recall coaching.

# Platform requirements

macOS needs both `NSMicrophoneUsageDescription` and
`NSSpeechRecognitionUsageDescription` in the bundle — the OS terminates the
process rather than prompting when they are missing — and, under the hardened
runtime, the `com.apple.security.device.audio-input` entitlement. Consent is
therefore only obtainable from the signed app bundle, never from a bare test
binary.

Windows serves free-form dictation from the installed speech language pack.
Unlike macOS it exposes no on-device flag, so ZAM treats Windows local
recognition as available only when the recognizer compiles its constraints on
that machine, and does not claim it is provably offline.

# Availability is per device

Voice mode is the first ZAM feature whose availability legitimately differs per
machine. `voice_capabilities` reports each local capability plus a human
readable reason when it is missing, and surfaces render that reason instead of
a dead button.

# Citations

- [ADR 2026-07-31 — Cross-Platform Voice Mode](../adr/2026-07-31-cross-platform-voice-mode.md)
- [ADR 2026-07-21 — Android Companion Tauri Shell](../adr/2026-07-21-android-companion-tauri-shell.md)
- [ADR 2026-07-12 — Unified Capability Model Registry](../adr/2026-07-12-unified-capability-model-registry.md)
- Tests: `tests/kernel/voice-review.test.ts`, `tests/desktop/voice.test.ts`, `tests/cli/speech.test.ts`, `tests/mobile/voice.test.ts`, `tests/mobile/voice-wiring.test.ts`
- Code: `src/kernel/recall/voice-review.ts`, `src/cli/llm/speech.ts`, `src/cli/llm/capability-probe.ts`, `desktop/src/voice.ts`, `desktop/src-tauri/src/voice.rs`, `mobile/src/voice.ts`, `src/kernel/system/install-config.ts`
