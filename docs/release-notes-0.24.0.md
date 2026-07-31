# ZAM 0.24.0 — Voice mode on the desktop

Review out loud, hands free — on a walk, during housework, at the gym. The
Android companion has had voice review since 0.22.x; it now works on macOS and
Windows too, and both platforms share one review loop with Android.

ZAM reads a due card aloud, listens for your spoken answer, reads back the
expected answer or an evaluation of yours, and takes the rating as a spoken
word — "nochmal", "schwer", "gut", "leicht", or their English equivalents.
Typing and clicking keep working throughout; voice mode is an additional way
in, not a mode you get trapped in.

## You choose who hears you

Settings has a new **Voice mode** section with three options:

| Choice | What happens |
| --- | --- |
| **This device only** | Speech never leaves your machine. Voice mode may be unavailable, and that is the point of the setting. |
| **This device, cloud if needed** *(default)* | Your device handles what it can; anything it cannot goes to the speech model you configured. |
| **Best quality** | The cloud model first, your device as fallback. |

Underneath, ZAM states what is actually happening right now — "Alles bleibt auf
diesem Gerät" or "Deine Aufnahmen gehen an das Sprachmodell, das du eingerichtet
hast". A preference on its own is not informative: "best quality" on a machine
with no speech model configured still runs locally, and you should be able to
see that rather than assume it.

Speech-to-text and text-to-speech are decided separately, so a machine that can
speak but not listen still reads your cards aloud.

The default is deliberate. Preferring your own device keeps recordings private
and free, but a voice mode that mishears every third answer does not get used —
and the alternative to a slightly costly review on a walk is usually no review
at all. What that costs is a fraction of a cent; what the material is worth to
you is not. Which way that trades is your call, not ZAM's, which is why the
setting exists and why "this device only" is a fully supported answer.

## Your device, natively

The local tier is your operating system's own speech stack — nothing to
download, no model to manage, and covered by the privacy permissions you have
already granted:

| Platform | Listening | Speaking |
| --- | --- | --- |
| macOS | Apple's on-device recognition | System voices |
| Windows | The installed speech language pack | System voices |
| Android | On-device recognition | Installed offline voices |

Where a device cannot do something, ZAM says so in plain words — "no on-device
speech model is installed for German or English" — instead of showing a button
that does nothing.

macOS will ask for microphone and speech-recognition permission the first time
you start voice mode.

## Cloud speech, on your terms

The cloud tier is an ordinary entry in the model registry with the new **stt**
or **tts** capability ticked, so it works with any OpenAI-compatible speech
endpoint. Nothing is hardcoded to a vendor. A self-hosted transcription server
counts as local, which means it also satisfies "this device only" — the way to
get strict privacy on Linux, where no built-in offline recognizer exists.

Recordings are deleted as soon as they have been transcribed, whichever tier
did the work, and are never written to your database.

## Notes for this release

- Voice mode on the **iPad/iOS companion** is not in this release; it needs its
  own native plugin and a TestFlight round.
- **Linux** rides along on the shared code and can read cards aloud through
  speech-dispatcher, but has no built-in offline recognizer; it is not yet a
  supported voice-mode platform.
- Voice mode's German and English wording ships in this release. The Spanish,
  French, Portuguese, Chinese, and Japanese packs fall back to English until
  they have had a native review.

## Under the hood

- The hands-free review loop moved into the kernel
  (`src/kernel/recall/voice-review.ts`) so every surface runs identical logic;
  the Android behaviour is unchanged.
- Engine choice is machine-local in `~/.zam/config.json`, never the shared
  database — the right answer depends on the hardware in front of you, so a
  phone's answer must not be pushed onto your desktop.
- The capability probe now recognizes speech models and no longer offers them
  for text generation.
- New bridge commands: `voice-availability`, `voice-transcribe`,
  `voice-synthesize`, `voice-preference-get`, `voice-preference-set`.

The full reasoning, including the alternatives that were rejected, is in
[ADR 2026-07-31](adr/2026-07-31-cross-platform-voice-mode.md); the current
behaviour is documented in [the OKF article](okf/voice-mode.md).
